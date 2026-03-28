import boxen from 'boxen'
import { defineCommand, renderUsage } from 'citty'
import type { ArgsDef, CommandDef } from 'citty'
import pc from 'picocolors'
import type { CollectionConfig, Field, FieldWithSubFields } from 'payload'
import { fieldAffectsData, fieldHasSubFields, fieldIsArrayType } from 'payload/shared'

import { formatTable } from '../lib/format-table'
import { withPayloadAdmin } from '../lib/payload-admin-session'

function listFieldNames(field: Field, prefix = ''): string[] {
  if (fieldHasSubFields(field)) {
    const subs = (field as FieldWithSubFields).fields ?? []
    if (fieldAffectsData(field) && 'name' in field && field.name) {
      const path = prefix ? `${prefix}.${field.name}` : field.name
      if (fieldIsArrayType(field)) {
        return subs.flatMap((f: Field) => listFieldNames(f, `${path}[]`))
      }
      return subs.flatMap((f: Field) => listFieldNames(f, path))
    }
    return subs.flatMap((f: Field) => listFieldNames(f, prefix))
  }
  if (fieldAffectsData(field) && 'name' in field && field.name) {
    const path = prefix ? `${prefix}.${field.name}` : field.name
    return [path]
  }
  return []
}

const listCommand = defineCommand({
  meta: {
    name: 'list',
    description: 'List Payload collection slugs configured for this project (read-only).',
  },
  async run() {
    const result = await withPayloadAdmin(async ({ payload }) => {
      const cols = payload.config.collections ?? []
      const slugs = cols
        .map((c) => c.slug)
        .filter((slug) => typeof slug === 'string' && slug.length > 0) as string[]
      return [...slugs].sort()
    })
    if (!result.ok) {
      console.error(pc.red(result.message))
      process.exit(result.code)
    }
    const slugs = result.value
    console.log(
      boxen(
        `${pc.bold(String(slugs.length))} collections\n\n` + slugs.map((s) => pc.cyan(s)).join('\n'),
        { title: 'grimetime collections list', padding: 1, borderStyle: 'round', borderColor: 'blue' },
      ),
    )
  },
})

const describeArgs = {
  slug: {
    type: 'positional',
    required: true,
    description: 'Collection slug (e.g. pages, media, users)',
  },
} satisfies ArgsDef

const describeCommand = defineCommand({
  meta: {
    name: 'describe',
    description: 'Show labels and top-level fields for one collection (read-only).',
  },
  args: describeArgs,
  async run({ args }) {
    const slug = (args.slug as string).trim()
    const result = await withPayloadAdmin(async ({ payload }) => {
      const cols = payload.config.collections ?? []
      const col = cols.find((c) => c.slug === slug) as (CollectionConfig & { slug: string }) | undefined
      if (!col) return { error: `Unknown collection slug: ${slug}` }
      const labels = (col.labels as { singular?: string; plural?: string } | undefined) ?? {}
      const fields = (col.fields ?? []).flatMap((f) => listFieldNames(f as Field))
      return { col, labels, fields }
    })
    if (!result.ok) {
      console.error(pc.red(result.message))
      process.exit(result.code)
    }
    const data = result.value as
      | { error: string }
      | { col: CollectionConfig; labels: { singular?: string; plural?: string }; fields: string[] }
    if ('error' in data) {
      console.error(pc.red(data.error))
      process.exit(1)
    }
    const { col, labels, fields } = data
    console.log(
      boxen(
        [
          `${pc.cyan('slug')}:     ${col.slug}`,
          `${pc.cyan('singular')}: ${labels.singular ?? '—'}`,
          `${pc.cyan('plural')}:   ${labels.plural ?? '—'}`,
          '',
          pc.bold('Fields'),
          fields.length ? formatTable(['path'], fields.map((f) => [f])) : pc.dim('(none)'),
        ].join('\n'),
        { title: `collection: ${slug}`, padding: 1, borderStyle: 'round', borderColor: 'green' },
      ),
    )
  },
})

let collectionsRootRef: CommandDef

collectionsRootRef = defineCommand({
  meta: {
    name: 'collections',
    description:
      'Inspect Payload collection configuration (read-only). Scopes in `grimetime seed` are higher-level bundles over these collections.',
  },
  subCommands: {
    describe: describeCommand,
    list: listCommand,
  },
})

export const collectionsRootCommand = collectionsRootRef

export async function printCollectionsQuickHelp(parent?: CommandDef): Promise<void> {
  console.log(
    boxen(
      [
        pc.bold('grimetime collections') + pc.dim(' — Payload collection configuration (read-only)'),
        '',
        `${pc.cyan('list')}      All collection slugs`,
        `${pc.cyan('describe')}  Fields for one slug`,
      ].join('\n'),
      { title: 'collections', padding: 1, borderStyle: 'round', borderColor: 'magenta' },
    ),
  )
  console.log((await renderUsage(collectionsRootCommand, parent)) + '\n')
}
