import fs from 'node:fs'
import path from 'node:path'

import boxen from 'boxen'
import { defineCommand, renderUsage, runMain, showUsage as cittyShowUsage } from 'citty'
import type { ArgsDef, CommandDef } from 'citty'
import pc from 'picocolors'

import { getCliPackageVersion } from './lib/pkg'
import { resolveRepoRoot } from './lib/repo-root'
import {
  collectionsRootCommand,
  printCollectionsQuickHelp,
} from './collections/collections-commands'
import { formatSeedDomainsCatalog, printSeedQuickHelp, seedRootCommand } from './seed/seed-commands'

async function resolveValue<T>(input: T | (() => T) | (() => Promise<T>)): Promise<T> {
  if (typeof input === 'function') {
    return (input as () => T | Promise<T>)()
  }
  return input
}

async function formatBanner(): Promise<string> {
  let description = 'Developer CLI — Payload, ops, and seed workflows'
  try {
    const root = resolveRepoRoot()
    const raw = fs.readFileSync(path.join(root, 'package.json'), 'utf8')
    const pkg = JSON.parse(raw) as { description?: string }
    if (pkg.description) {
      description = pkg.description
    }
  } catch {
    // keep default
  }

  const lines = [pc.bold(pc.cyan('Grime Time')), pc.dim(description)]
  return boxen(lines.join('\n'), {
    padding: { left: 2, right: 2, top: 0, bottom: 0 },
    margin: { bottom: 1 },
    borderStyle: 'round',
    borderColor: 'cyan',
  })
}

async function showUsageRich<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  parent?: CommandDef<T>,
): Promise<void> {
  if (!parent) {
    console.log(await formatBanner())
  }

  const cmdMeta = await resolveValue(cmd.meta || {})
  const parentMeta = parent ? await resolveValue(parent.meta || {}) : {}
  const name = cmdMeta.name
  const parentName = parentMeta.name
  const showDomainsFirst =
    name === 'seed' ||
    (parentName === 'seed' && (name === 'push' || name === 'pull' || name === 'delete'))
  if (showDomainsFirst) {
    console.log(formatSeedDomainsCatalog())
  }

  await cittyShowUsage(cmd, parent)
}

const doctorCommand = defineCommand({
  meta: {
    name: 'doctor',
    description: 'Verify the Grime Time package root and print quick environment facts.',
  },
  async run() {
    const root = resolveRepoRoot()
    const body =
      `${pc.cyan('Package root')}: ${pc.white(root)}\n` +
      `${pc.cyan('process.cwd()')} ${pc.white(process.cwd())}\n` +
      `${pc.cyan('Node')}:         ${pc.white(process.version)}`
    console.log(
      boxen(body, {
        title: pc.bold('grimetime doctor'),
        titleAlignment: 'center',
        padding: 1,
        borderStyle: 'round',
        borderColor: 'green',
      }),
    )
  },
})

let mainRef: CommandDef

const helpCommand = defineCommand({
  meta: {
    name: 'help',
    description: 'Show help for grimetime or a subcommand (same as --help at that level).',
  },
  args: {
    topic: {
      type: 'positional',
      description: 'Command name (e.g. seed, doctor)',
      required: false,
    },
  },
  async run({ args }) {
    const topic = args.topic
    if (!topic) {
      console.log(await formatBanner())
      console.log((await renderUsage(mainRef)) + '\n')
      return
    }
    const subs = await resolveValue(mainRef.subCommands)
    if (!subs?.[topic]) {
      console.error(pc.red(`Unknown command: ${topic}`) + '\n')
      console.log((await renderUsage(mainRef)) + '\n')
      process.exit(1)
    }
    const sub = await resolveValue(subs[topic])
    if (topic === 'seed') {
      console.log(formatSeedDomainsCatalog())
    }
    if (topic === 'collections') {
      await printCollectionsQuickHelp(mainRef)
      return
    }
    console.log((await renderUsage(sub, mainRef)) + '\n')
  },
})

mainRef = defineCommand({
  meta: {
    name: 'grimetime',
    version: getCliPackageVersion(),
    description: 'Grime Time — developer tools for this repository (Payload site + ops).',
  },
  subCommands: {
    collections: collectionsRootCommand,
    doctor: doctorCommand,
    help: helpCommand,
    seed: seedRootCommand,
  },
})

export async function runGrimetimeMain(): Promise<void> {
  const rawArgs = process.argv.slice(2)

  if (rawArgs.length === 1 && rawArgs[0] === 'seed') {
    console.log(await formatBanner())
    await printSeedQuickHelp()
    process.exit(0)
  }

  if (rawArgs.length === 1 && rawArgs[0] === 'collections') {
    console.log(await formatBanner())
    await printCollectionsQuickHelp(mainRef)
    process.exit(0)
  }

  if (rawArgs.length === 0) {
    console.log(await formatBanner())
    console.log((await renderUsage(mainRef)) + '\n')
    process.exit(0)
  }

  await runMain(mainRef, { rawArgs, showUsage: showUsageRich })
}
