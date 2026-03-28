import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  EXPECTED_CATEGORY_SLUGS,
  EXPECTED_CRM_SEQUENCE_KEYS,
  EXPECTED_FORM_TITLES,
  EXPECTED_GLOBAL_SLUGS,
  EXPECTED_PAGE_SLUGS,
  EXPECTED_POST_SLUGS,
  EXPECTED_SEED_MEDIA_FILENAMES,
  EXPECTED_ASSET_LADDER_LABELS,
  EXPECTED_GROWTH_MILESTONE_TITLES,
  EXPECTED_LIABILITY_LABELS,
  EXPECTED_SCORECARD_TITLES,
  EXPECTED_DEMO_ACCOUNT_NAMES,
} from '@/endpoints/seed/expectations'
import type { SeedScope } from '@/endpoints/seed/scopes'
import { ALL_SEED_SCOPES, parseSeedDomainArg, SEED_SCOPE_ALL } from '@/endpoints/seed/scopes'
import { portalPreviewTestUserEmail } from '@/lib/auth/previewIdentity'
import { resolveSeedStaffEmails } from '@/utilities/quotesAccess'

import type { AdminSession } from './payload-admin-session'

function safeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]+/g, '_')
}

async function writeJson(absPath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(absPath), { recursive: true })
  await writeFile(absPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function pullFoundation({ payload, req }: AdminSession, outDir: string): Promise<string[]> {
  const written: string[] = []
  const staffEmails = resolveSeedStaffEmails()
  const staffDocs = []
  for (const email of staffEmails) {
    const found = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      req,
      where: { email: { equals: email } },
    })
    if (found.docs[0]) staffDocs.push(found.docs[0])
  }
  const p = path.join(outDir, 'foundation', 'staff-users.json')
  await writeJson(p, staffDocs)
  written.push(p)

  const previewEmail = portalPreviewTestUserEmail()
  const prev = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    req,
    where: { email: { equals: previewEmail } },
  })
  const p2 = path.join(outDir, 'foundation', 'preview-customer-user.json')
  await writeJson(p2, prev.docs[0] ?? null)
  written.push(p2)
  return written
}

async function pullMedia({ payload, req }: AdminSession, outDir: string): Promise<string[]> {
  const written: string[] = []
  const dir = path.join(outDir, 'media')
  for (const filename of EXPECTED_SEED_MEDIA_FILENAMES) {
    const found = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      req,
      where: { filename: { equals: filename } },
    })
    const p = path.join(dir, `${safeFilename(filename)}.json`)
    await writeJson(p, found.docs[0] ?? null)
    written.push(p)
  }
  return written
}

async function pullTaxonomy({ payload, req }: AdminSession, outDir: string): Promise<string[]> {
  const written: string[] = []
  const dir = path.join(outDir, 'categories')
  for (const slug of EXPECTED_CATEGORY_SLUGS) {
    const found = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1,
      req,
      where: { slug: { equals: slug } },
    })
    const p = path.join(dir, `${slug}.json`)
    await writeJson(p, found.docs[0] ?? null)
    written.push(p)
  }
  return written
}

async function pullPosts({ payload, req }: AdminSession, outDir: string): Promise<string[]> {
  const written: string[] = []
  const dir = path.join(outDir, 'posts')
  for (const slug of EXPECTED_POST_SLUGS) {
    const found = await payload.find({
      collection: 'posts',
      depth: 0,
      limit: 1,
      req,
      where: { slug: { equals: slug } },
    })
    const p = path.join(dir, `${slug}.json`)
    await writeJson(p, found.docs[0] ?? null)
    written.push(p)
  }
  return written
}

async function pullForms({ payload, req }: AdminSession, outDir: string): Promise<string[]> {
  const written: string[] = []
  const dir = path.join(outDir, 'forms')
  for (const title of EXPECTED_FORM_TITLES) {
    const found = await payload.find({
      collection: 'forms',
      depth: 0,
      limit: 1,
      req,
      where: { title: { equals: title } },
    })
    const p = path.join(dir, `${safeFilename(title)}.json`)
    await writeJson(p, found.docs[0] ?? null)
    written.push(p)
  }
  return written
}

async function pullPages({ payload, req }: AdminSession, outDir: string): Promise<string[]> {
  const written: string[] = []
  const dir = path.join(outDir, 'pages')
  for (const slug of EXPECTED_PAGE_SLUGS) {
    const found = await payload.find({
      collection: 'pages',
      depth: 0,
      limit: 1,
      req,
      where: { slug: { equals: slug } },
    })
    const p = path.join(dir, `${slug}.json`)
    await writeJson(p, found.docs[0] ?? null)
    written.push(p)
  }
  return written
}

async function pullGlobals({ payload, req }: AdminSession, outDir: string): Promise<string[]> {
  const written: string[] = []
  const dir = path.join(outDir, 'globals')
  for (const slug of EXPECTED_GLOBAL_SLUGS) {
    try {
      const doc = await payload.findGlobal({ slug, depth: 0, req })
      const p = path.join(dir, `${slug}.json`)
      await writeJson(p, doc ?? null)
      written.push(p)
    } catch {
      const p = path.join(dir, `${slug}.json`)
      await writeJson(p, null)
      written.push(p)
    }
  }
  return written
}

async function pullOps({ payload, req }: AdminSession, outDir: string): Promise<string[]> {
  const written: string[] = []

  async function dump(
    collection: 'growth-milestones' | 'ops-asset-ladder-items' | 'ops-liability-items' | 'ops-scorecard-rows',
    field: 'title' | 'label',
    values: readonly string[],
    subdir: string,
  ) {
    const dir = path.join(outDir, 'ops', subdir)
    for (const v of values) {
      const found = await payload.find({
        collection,
        depth: 0,
        limit: 1,
        req,
        where: { [field]: { equals: v } },
      })
      const p = path.join(dir, `${safeFilename(v)}.json`)
      await writeJson(p, found.docs[0] ?? null)
      written.push(p)
    }
  }

  await dump('growth-milestones', 'title', EXPECTED_GROWTH_MILESTONE_TITLES, 'growth-milestones')
  await dump('ops-asset-ladder-items', 'label', EXPECTED_ASSET_LADDER_LABELS, 'asset-ladder')
  await dump('ops-liability-items', 'label', EXPECTED_LIABILITY_LABELS, 'liabilities')
  await dump('ops-scorecard-rows', 'title', EXPECTED_SCORECARD_TITLES, 'scorecard')
  return written
}

async function pullCrm({ payload, req }: AdminSession, outDir: string): Promise<string[]> {
  const written: string[] = []
  const dir = path.join(outDir, 'crm-sequences')
  for (const key of EXPECTED_CRM_SEQUENCE_KEYS) {
    const found = await payload.find({
      collection: 'crm-sequences',
      depth: 0,
      limit: 1,
      req,
      where: { key: { equals: key } },
    })
    const p = path.join(dir, `${safeFilename(key)}.json`)
    await writeJson(p, found.docs[0] ?? null)
    written.push(p)
  }
  return written
}

async function pullDemo({ payload, req }: AdminSession, outDir: string): Promise<string[]> {
  const written: string[] = []
  const dir = path.join(outDir, 'demo', 'accounts')
  for (const name of EXPECTED_DEMO_ACCOUNT_NAMES) {
    const found = await payload.find({
      collection: 'accounts',
      depth: 0,
      limit: 1,
      req,
      where: { name: { equals: name } },
    })
    const p = path.join(dir, `${safeFilename(name)}.json`)
    await writeJson(p, found.docs[0] ?? null)
    written.push(p)
  }
  return written
}

const PULL_HANDLERS: Record<SeedScope, (s: AdminSession, outDir: string) => Promise<string[]>> = {
  foundation: pullFoundation,
  media: pullMedia,
  taxonomy: pullTaxonomy,
  posts: pullPosts,
  forms: pullForms,
  pages: pullPages,
  globals: pullGlobals,
  ops: pullOps,
  crm: pullCrm,
  demo: pullDemo,
}

export type SeedPullResult = {
  outDir: string
  scopes: SeedScope[]
  files: string[]
}

/**
 * Export documents keyed by repository seed expectations into `outDir` (JSON snapshots).
 * Not a full collection dump — only rows the seed identifies by slug/filename/title/key.
 * Uses **requested** scopes only (no dependency expansion — `pull globals` exports globals, not pages/media).
 */
export async function runSeedPull(
  session: AdminSession,
  domainArg: string,
  options: { outDir: string },
): Promise<SeedPullResult> {
  const scopes: SeedScope[] =
    domainArg === SEED_SCOPE_ALL ? [...ALL_SEED_SCOPES] : parseSeedDomainArg(domainArg)

  const files: string[] = []
  for (const scope of scopes) {
    const part = await PULL_HANDLERS[scope](session, options.outDir)
    files.push(...part)
  }

  const manifest = {
    version: 1,
    pulledAt: new Date().toISOString(),
    scopes,
    note: 'Snapshot of seed-keyed documents only. Globals are Payload global documents.',
  }
  const manifestPath = path.join(options.outDir, 'manifest.json')
  await writeJson(manifestPath, manifest)
  files.unshift(manifestPath)

  return { outDir: options.outDir, scopes, files }
}
