import { createInterface } from 'node:readline'
import path from 'node:path'

import boxen from 'boxen'
import { defineCommand, renderUsage } from 'citty'
import type { ArgsDef, CommandDef } from 'citty'
import pc from 'picocolors'

import {
  SEED_SCOPES,
  SEED_SCOPE_ALL,
  SCOPE_DESCRIPTIONS,
  expandScopes,
  parseSeedDomainArg,
} from '@/endpoints/seed/scopes'

import { formatTable } from '../lib/format-table'
import { withPayloadAdmin } from '../lib/payload-admin-session'
import { runSeedDelete } from '../lib/seed-delete'
import { runSeedPull } from '../lib/seed-pull'
import { runSeedCheck } from '../lib/seed-check'
import {
  fileCountForScope,
  listSourceFilesForScopes,
  SEED_ROOT_RELATIVE,
  SCOPE_PRIMARY_COLLECTIONS,
} from '../lib/seed-scope-manifest'
import { resolveSeedPlanDetails } from '../lib/seed-plan-report'
import { resolveRepoRoot } from '../lib/repo-root'

const DOMAIN_OPTIONS = [SEED_SCOPE_ALL, ...SEED_SCOPES] as string[]

const DOMAIN_LABEL_WIDTH = Math.max(...DOMAIN_OPTIONS.map((d) => d.length), 12)

/** Full scope reference: only for `grimetime seed --help` / `grimetime seed` (no subcommand). */
export function formatSeedDomainsCatalog(): string {
  const lines: string[] = [
    pc.bold('Seed scopes') +
      pc.dim(' — operational slices of the app; `push` adds dependency scopes automatically.'),
    '',
    `  ${pc.cyan(SEED_SCOPE_ALL.padEnd(DOMAIN_LABEL_WIDTH))}  ${pc.dim('All scopes in order (full database seed)')}`,
    '',
  ]
  for (const s of SEED_SCOPES) {
    lines.push(`  ${pc.cyan(s.padEnd(DOMAIN_LABEL_WIDTH))}  ${SCOPE_DESCRIPTIONS[s]}`)
  }
  return (
    boxen(lines.join('\n'), {
      padding: { left: 1, right: 1, top: 0, bottom: 0 },
      margin: { top: 1, bottom: 0 },
      borderStyle: 'round',
      borderColor: 'blue',
      title: 'Scopes',
      titleAlignment: 'left',
    }) + '\n'
  )
}

export function assertValidScope(raw: string | undefined, label: string): string {
  if (!raw || !DOMAIN_OPTIONS.includes(raw)) {
    console.error(pc.red(`${label}: scope must be one of: ${DOMAIN_OPTIONS.join(', ')}`))
    process.exit(1)
  }
  return raw
}

function formatScopeListForAll(): string {
  try {
    const expanded = expandScopes(parseSeedDomainArg(SEED_SCOPE_ALL))
    return expanded.map((s) => `  • ${pc.cyan(s)} — ${SCOPE_DESCRIPTIONS[s]}`).join('\n')
  } catch {
    return ''
  }
}

async function confirmPushAll(): Promise<boolean> {
  if (process.env.GRIMETIME_YES === '1' || process.env.GRIMETIME_YES === 'true') {
    return true
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return false
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = await new Promise<string>((resolve) => {
      rl.question(
        pc.yellow('Type ') + pc.bold('yes') + pc.yellow(' to run a full seed (all scopes): '),
        resolve,
      )
    })
    return answer.trim().toLowerCase() === 'yes'
  } finally {
    rl.close()
  }
}

const scopePositional = {
  type: 'positional' as const,
  required: true,
  description: 'Scope: ' + DOMAIN_OPTIONS.join(', '),
}

const pushArgs = {
  scope: scopePositional,
  baseline: {
    type: 'boolean',
    description: 'Skip demo fixtures (omit `demo` scope)',
    alias: 'b',
  },
  yes: {
    type: 'boolean',
    description: 'Skip confirmation for `push all` (or set GRIMETIME_YES=1)',
    alias: 'y',
  },
  dryRun: {
    type: 'boolean',
    description: 'Print resolved scopes only (no database)',
    alias: 'n',
  },
  only: {
    type: 'string',
    description: 'Only for `push all`: comma-separated scopes (for example pages,globals)',
  },
  noInput: {
    type: 'boolean',
    description: 'Disable interactive prompts and fail fast if confirmation is required',
  },
} satisfies ArgsDef

const pushCommand = defineCommand({
  meta: {
    name: 'push',
    description:
      'Apply repository seed definitions to the database (idempotent upsert). Dependencies are merged automatically.',
  },
  args: pushArgs,
  async run({ args }) {
    const scope = assertValidScope(args.scope as string | undefined, 'grimetime seed push')
    let plan
    try {
      plan = resolveSeedPlanDetails({
        baseline: Boolean(args.baseline),
        only: args.only as string | undefined,
        scope,
      })
    } catch (error) {
      console.error(pc.red(error instanceof Error ? error.message : String(error)))
      process.exit(1)
    }
    if (args.dryRun) {
      console.log(
        boxen(
          `${pc.bold('Dry run')}: scopes in order:\n\n${pc.cyan(plan.resolvedScopes.join(', '))}\n\n` +
            `${pc.dim('Requested:')} ${pc.white(plan.requestedScopes.join(', '))}` +
            `\n${pc.dim('Baseline:')} ${pc.white(plan.baseline ? 'yes' : 'no')}` +
            (plan.selectedByOnly ? `\n${pc.dim('Only:')} ${pc.white((args.only as string).trim())}` : ''),
          { padding: 1, borderStyle: 'round', borderColor: 'blue', title: 'grimetime seed push' },
        ),
      )
      return
    }

    if (scope === SEED_SCOPE_ALL && !args.yes) {
      if (args.noInput) {
        console.error(
          pc.red('Refused: `push all` with ') +
            pc.bold('--no-input') +
            pc.red(' also requires ') +
            pc.bold('--yes') +
            pc.red('.'),
        )
        process.exit(1)
      }
      const ok = await confirmPushAll()
      if (!ok) {
        console.error(pc.red('Aborted. Pass ') + pc.bold('--yes') + pc.red(' to continue without a prompt.'))
        process.exit(1)
      }
    }

    if (scope === SEED_SCOPE_ALL) {
      const scopePreview =
        !plan.selectedByOnly && !plan.baseline
          ? formatScopeListForAll()
          : plan.resolvedScopes
              .map((resolvedScope) => `  • ${pc.cyan(resolvedScope)} — ${SCOPE_DESCRIPTIONS[resolvedScope]}`)
              .join('\n')
      console.log(
        boxen(
          `${pc.yellow('Full seed')} runs every scope (users, media, pages, globals, ops, CRM templates, demo unless --baseline).\n\n` +
            `${pc.dim('Scopes:')}\n${scopePreview}`,
          { padding: 1, borderStyle: 'double', borderColor: 'yellow', title: pc.bold('grimetime seed push all') },
        ),
      )
    }

    const { runSeedScript } = await import('../lib/seed-runner')
    const code = await runSeedScript({
      baseline: plan.baseline,
      scopes: plan.requestedScopes,
    })
    if (code !== 0) process.exit(code)
  },
})

const pullArgs = {
  scope: scopePositional,
  out: {
    type: 'string',
    description:
      'Output directory (default: .grimetime-seed-pull/<UTC-timestamp> at repo root; gitignored)',
  },
} satisfies ArgsDef

const pullCommand = defineCommand({
  meta: {
    name: 'pull',
    description:
      'Export seed-keyed documents as JSON snapshots (not a full collection dump). Requires admin session.',
  },
  args: pullArgs,
  async run({ args }) {
    const scope = assertValidScope(args.scope as string | undefined, 'grimetime seed pull')
    const root = resolveRepoRoot()
    const outArg = (args.out as string | undefined)?.trim()
    const outDir =
      outArg ||
      path.join(root, '.grimetime-seed-pull', new Date().toISOString().replace(/[:.]/g, '-'))

    const result = await withPayloadAdmin(async (session) => runSeedPull(session, scope, { outDir }))
    if (!result.ok) {
      console.error(pc.red(result.message))
      process.exit(result.code)
    }
    const { files, scopes } = result.value
    console.log(
      boxen(
        [
          `${pc.dim('Scopes:')} ${scopes.join(', ')}`,
          `${pc.dim('Files written:')} ${files.length}`,
          `${pc.dim('Output:')} ${pc.cyan(outDir)}`,
        ].join('\n'),
        { padding: 1, borderStyle: 'round', borderColor: 'magenta', title: 'grimetime seed pull' },
      ),
    )
  },
})

const deleteArgs = {
  scope: scopePositional,
  yes: {
    type: 'boolean',
    description: 'Required — confirms destructive deletes',
    alias: 'y',
  },
  confirmAll: {
    type: 'boolean',
    description: 'Required with scope `all` (or set GRIMETIME_DELETE_ALL=1)',
  },
} satisfies ArgsDef

const deleteCommand = defineCommand({
  meta: {
    name: 'delete',
    description:
      'Remove documents keyed like repository seed (destructive). Staff admins are never deleted; `foundation` only removes the preview portal customer; `globals` is skipped.',
  },
  args: deleteArgs,
  async run({ args }) {
    const scope = assertValidScope(args.scope as string | undefined, 'grimetime seed delete')
    if (!args.yes) {
      console.error(pc.red('Refused: pass ') + pc.bold('--yes') + pc.red(' to confirm destructive deletes.'))
      process.exit(1)
    }
    if (
      scope === SEED_SCOPE_ALL &&
      !args.confirmAll &&
      process.env.GRIMETIME_DELETE_ALL !== '1' &&
      process.env.GRIMETIME_DELETE_ALL !== 'true'
    ) {
      console.error(
        pc.red('Refused: `delete all` requires ') +
          pc.bold('--confirm-all') +
          pc.red(' or environment ') +
          pc.bold('GRIMETIME_DELETE_ALL=1') +
          pc.red('.'),
      )
      process.exit(1)
    }

    const result = await withPayloadAdmin(async (session) => runSeedDelete(session, scope))
    if (!result.ok) {
      console.error(pc.red(result.message))
      process.exit(result.code)
    }
    const { scopes, skippedGlobals, noop } = result.value
    if (noop) {
      console.log(
        boxen(
          [
            pc.yellow('No collection documents deleted.'),
            '`globals` cannot be removed from the CLI; other scopes were not requested.',
            '',
            pc.dim('Reset globals with:'),
            pc.cyan(`grimetime seed push globals`),
          ].join('\n'),
          { padding: 1, borderStyle: 'round', borderColor: 'yellow', title: 'grimetime seed delete' },
        ),
      )
      return
    }
    console.log(
      boxen(
        [
          `${pc.red('Deleted')} seed-keyed data for scopes: ${pc.white(scopes.join(', '))}`,
          skippedGlobals
            ? pc.yellow('Note: `globals` was skipped (singleton config — use push to reset).')
            : '',
          '',
          pc.dim('Re-seed with:'),
          pc.cyan(`grimetime seed push ${scope === SEED_SCOPE_ALL ? 'all --yes' : scope}`),
        ]
          .filter(Boolean)
          .join('\n'),
        { padding: 1, borderStyle: 'double', borderColor: 'red', title: 'grimetime seed delete' },
      ),
    )
  },
})

const listCommand = defineCommand({
  meta: {
    name: 'list',
    description: 'Print repository source files that define the given seed scope (or all scopes).',
  },
  args: { scope: scopePositional },
  async run({ args }) {
    const scope = assertValidScope(args.scope as string | undefined, 'grimetime seed list')
    const scopes = scope === SEED_SCOPE_ALL ? [...SEED_SCOPES] : expandScopes(parseSeedDomainArg(scope))
    const files = listSourceFilesForScopes(scopes)
    const root = resolveRepoRoot()
    console.log(
      boxen(
        `${pc.dim('Seed root:')} ${pc.cyan(path.join(root, SEED_ROOT_RELATIVE))}\n` +
          `${pc.dim('Resolved scopes:')} ${pc.white(scopes.join(', '))}\n` +
          `${pc.dim('Files:')} ${files.length}`,
        { title: 'grimetime seed list', padding: 1, borderStyle: 'round', borderColor: 'cyan' },
      ),
    )
    console.log(files.map((f) => path.join(root, f.split('/').join(path.sep))).join('\n'))
  },
})

const planArgs = {
  scope: scopePositional,
  baseline: {
    type: 'boolean',
    description: 'Hide demo scope from the resolved plan',
    alias: 'b',
  },
  only: {
    type: 'string',
    description: 'Only for `all`: comma-separated scopes (for example pages,globals)',
  },
  json: {
    type: 'boolean',
    description: 'Print machine-readable JSON (stdout only)',
  },
} satisfies ArgsDef

const planCommand = defineCommand({
  meta: {
    name: 'plan',
    description:
      'Show the resolved scope order, dependencies, primary collections, and source files without touching the database.',
  },
  args: planArgs,
  async run({ args }) {
    const scope = assertValidScope(args.scope as string | undefined, 'grimetime seed plan')

    let plan
    try {
      plan = resolveSeedPlanDetails({
        baseline: Boolean(args.baseline),
        only: args.only as string | undefined,
        scope,
      })
    } catch (error) {
      console.error(pc.red(error instanceof Error ? error.message : String(error)))
      process.exit(1)
    }

    if (args.json) {
      console.log(
        JSON.stringify({
          baseline: plan.baseline,
          only: args.only ?? null,
          primaryCollections: plan.primaryCollections,
          requestedScopes: plan.requestedScopes,
          resolvedScopes: plan.resolvedScopes,
          sourceFiles: plan.sourceFiles,
        }),
      )
      return
    }

    console.log(
      boxen(
        [
          `${pc.dim('Requested:')} ${pc.white(plan.requestedScopes.join(', '))}`,
          `${pc.dim('Resolved:')} ${pc.cyan(plan.resolvedScopes.join(', '))}`,
          `${pc.dim('Baseline:')} ${pc.white(plan.baseline ? 'yes' : 'no')}`,
          args.only ? `${pc.dim('Only:')} ${pc.white((args.only as string).trim())}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        { title: 'grimetime seed plan', padding: 1, borderStyle: 'round', borderColor: 'blue' },
      ),
    )
    console.log('')
    console.log(
      formatTable(
        ['Scope', 'Primary data'],
        plan.primaryCollections.map((row) => [row.scope, row.collection]),
      ),
    )
    console.log('')
    console.log(pc.bold('Source files'))
    console.log(plan.sourceFiles.join('\n'))
  },
})

const reportArgs = {
  scope: {
    type: 'positional' as const,
    required: false,
    description: 'Optional scope (default: all)',
  },
  baseline: {
    type: 'boolean',
    description: 'Hide demo scope from the report',
    alias: 'b',
  },
  only: {
    type: 'string',
    description: 'Only for `all`: comma-separated scopes (for example pages,globals)',
  },
  json: {
    type: 'boolean',
    description: 'Print machine-readable JSON (stdout only)',
  },
} satisfies ArgsDef

const reportCommand = defineCommand({
  meta: {
    name: 'report',
    description:
      'Print a scope-oriented report for seed planning: counts, source files, primary collections, and dependency-resolved execution order.',
  },
  args: reportArgs,
  async run({ args }) {
    const scope = assertValidScope(
      (args.scope as string | undefined) ?? SEED_SCOPE_ALL,
      'grimetime seed report',
    )

    let plan
    try {
      plan = resolveSeedPlanDetails({
        baseline: Boolean(args.baseline),
        only: args.only as string | undefined,
        scope,
      })
    } catch (error) {
      console.error(pc.red(error instanceof Error ? error.message : String(error)))
      process.exit(1)
    }

    const rows = plan.resolvedScopes.map((resolvedScope) => ({
      description: SCOPE_DESCRIPTIONS[resolvedScope],
      files: fileCountForScope(resolvedScope),
      primaryData: SCOPE_PRIMARY_COLLECTIONS[resolvedScope],
      scope: resolvedScope,
    }))

    if (args.json) {
      console.log(
        JSON.stringify({
          baseline: plan.baseline,
          only: args.only ?? null,
          requestedScopes: plan.requestedScopes,
          resolvedScopes: plan.resolvedScopes,
          rows,
          sourceFiles: plan.sourceFiles,
        }),
      )
      return
    }

    console.log(
      boxen(
        [
          `${pc.dim('Requested:')} ${pc.white(plan.requestedScopes.join(', '))}`,
          `${pc.dim('Resolved:')} ${pc.cyan(plan.resolvedScopes.join(', '))}`,
          `${pc.dim('Files:')} ${pc.white(String(plan.sourceFiles.length))}`,
        ].join('\n'),
        { title: 'grimetime seed report', padding: 1, borderStyle: 'round', borderColor: 'green' },
      ),
    )
    console.log('')
    console.log(
      formatTable(
        ['Scope', 'Primary data', 'Files', 'Description'],
        rows.map((row) => [row.scope, row.primaryData, String(row.files), row.description]),
      ),
    )
  },
})

const summaryArgs = {
  json: {
    type: 'boolean',
    description: 'Print machine-readable JSON (stdout only)',
  },
} satisfies ArgsDef

const summaryCommand = defineCommand({
  meta: {
    name: 'summary',
    description: 'Table of seed scopes, primary Payload data, and source file counts.',
  },
  args: summaryArgs,
  async run({ args }) {
    const root = resolveRepoRoot()
    const seedAbs = path.join(root, SEED_ROOT_RELATIVE.split('/').join(path.sep))
    const scopeRows = SEED_SCOPES.map((s) => ({
      scope: s,
      primaryData: SCOPE_PRIMARY_COLLECTIONS[s],
      files: fileCountForScope(s),
      description: SCOPE_DESCRIPTIONS[s],
    }))

    if (args.json) {
      console.log(
        JSON.stringify({
          seedRoot: seedAbs,
          expectationsPath: 'src/endpoints/seed/expectations.ts',
          scopes: [
            {
              scope: SEED_SCOPE_ALL,
              primaryData: 'entire app seed',
              files: listSourceFilesForScopes([...SEED_SCOPES]).length,
              description: 'Runs all scopes in dependency order',
            },
            ...scopeRows,
          ],
        }),
      )
      return
    }

    console.log(
      boxen(
        `${pc.bold('Seed root (repository)')}\n${pc.cyan(seedAbs)}`,
        { title: 'grimetime seed summary', padding: 1, borderStyle: 'round', borderColor: 'green' },
      ),
    )
    const rows = scopeRows.map((r) => [
      r.scope,
      r.primaryData,
      String(r.files),
      r.description.length > 52 ? r.description.slice(0, 49) + '…' : r.description,
    ])
    console.log('')
    console.log(
      formatTable(['Scope', 'Primary data', 'Files', 'Description'], [
        [
          SEED_SCOPE_ALL,
          'entire app seed',
          String(listSourceFilesForScopes([...SEED_SCOPES]).length),
          'Runs all scopes in dependency order',
        ],
        ...rows,
      ]),
    )
    console.log('')
    console.log(pc.dim('Expectations for `check`: ') + pc.cyan('src/endpoints/seed/expectations.ts'))
  },
})

const checkArgs = {
  scope: scopePositional,
  json: {
    type: 'boolean',
    description: 'Print machine-readable JSON (stdout only)',
  },
} satisfies ArgsDef

const checkCommand = defineCommand({
  meta: {
    name: 'check',
    description:
      'Compare the database to repository seed expectations (keys, titles, globals fields, demo counts). Requires admin credentials.',
  },
  args: checkArgs,
  async run({ args }) {
    const scope = assertValidScope(args.scope as string | undefined, 'grimetime seed check')
    const json = Boolean(args.json)
    const result = await withPayloadAdmin(async (session) => runSeedCheck(session, scope, { json }))
    if (!result.ok) {
      console.error(pc.red(result.message))
      process.exit(result.code)
    }
    if (!result.value.ok) {
      process.exit(3)
    }
  },
})

let seedRootRef: CommandDef

seedRootRef = defineCommand({
  meta: {
    name: 'seed',
    description:
      'Manage seeded data by scope: inspect (`list`, `summary`, `check`), apply (`push`), future `pull` / `delete`.',
  },
  subCommands: {
    check: checkCommand,
    delete: deleteCommand,
    list: listCommand,
    plan: planCommand,
    pull: pullCommand,
    push: pushCommand,
    report: reportCommand,
    summary: summaryCommand,
  },
})

export const seedRootCommand = seedRootRef

export async function printSeedQuickHelp(): Promise<void> {
  const lines = [
    pc.bold('grimetime seed') + pc.dim(' — scope-oriented seed tooling'),
    '',
    `${pc.cyan('list')} <scope>     Source files for that scope`,
    `${pc.cyan('summary')}         Table of scopes + seed folder path`,
    `${pc.cyan('check')} <scope>   DB vs repository expectations`,
    `${pc.cyan('plan')} <scope>    Show resolved dependency order before push`,
    `${pc.cyan('report')} [scope]  Scope-oriented planning report`,
    `${pc.cyan('push')} <scope>    Apply seed to database`,
    `${pc.cyan('pull')} <scope>    JSON snapshot of seed-keyed docs → .grimetime-seed-pull/`,
    `${pc.cyan('delete')} <scope>  Remove seed-keyed docs (${pc.bold('--yes')}; all needs ${pc.bold('--confirm-all')})`,
    '',
    pc.dim('Examples:'),
    `  ${pc.green('grimetime seed summary')}`,
    `  ${pc.green('grimetime seed list pages')}`,
    `  ${pc.green('grimetime seed check media')}`,
    `  ${pc.green('grimetime seed plan all --only pages,globals')}`,
    `  ${pc.green('grimetime seed push all --yes')}`,
  ]
  console.log(
    boxen(lines.join('\n'), {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: 'round',
      borderColor: 'cyan',
      title: 'seed',
    }),
  )
  console.log(formatSeedDomainsCatalog())
  console.log((await renderUsage(seedRootCommand)) + '\n')
}
