import {
  EXPECTED_CATEGORY_SLUGS,
  EXPECTED_CRM_SEQUENCE_KEYS,
  EXPECTED_FORM_TITLES,
  EXPECTED_PAGE_SLUGS,
  EXPECTED_POST_SLUGS,
  EXPECTED_SEED_MEDIA_FILENAMES,
  EXPECTED_ASSET_LADDER_LABELS,
  EXPECTED_GROWTH_MILESTONE_TITLES,
  EXPECTED_LIABILITY_LABELS,
  EXPECTED_SCORECARD_TITLES,
  EXPECTED_DEMO_ACCOUNT_NAMES,
} from '@/endpoints/seed/expectations'
import { purgeDemoSeedFixtures } from '@/endpoints/seed/demo-seed'
import type { SeedScope } from '@/endpoints/seed/scopes'
import { ALL_SEED_SCOPES, parseSeedDomainArg, SEED_SCOPE_ALL } from '@/endpoints/seed/scopes'
import { portalPreviewTestUserEmail } from '@/lib/auth/previewIdentity'

import type { Where } from 'payload'

import type { AdminSession } from './payload-admin-session'

type SeedScopeDeletable = Exclude<SeedScope, 'globals'>

async function deleteWhere(
  payload: AdminSession['payload'],
  req: AdminSession['req'],
  collection: 'categories' | 'crm-sequences' | 'forms' | 'growth-milestones' | 'media' | 'ops-asset-ladder-items' | 'ops-liability-items' | 'ops-scorecard-rows' | 'pages' | 'posts' | 'users',
  where: Where,
): Promise<void> {
  await payload.delete({ collection, depth: 0, where, req })
}

async function deleteMediaScope({ payload, req }: AdminSession): Promise<void> {
  for (const filename of EXPECTED_SEED_MEDIA_FILENAMES) {
    try {
      await deleteWhere(payload, req, 'media', { filename: { equals: filename } })
    } catch {
      /* absent or blocked */
    }
  }
}

async function deleteTaxonomyScope({ payload, req }: AdminSession): Promise<void> {
  for (const slug of EXPECTED_CATEGORY_SLUGS) {
    try {
      await deleteWhere(payload, req, 'categories', { slug: { equals: slug } })
    } catch {
      /* */
    }
  }
}

async function deletePostsScope({ payload, req }: AdminSession): Promise<void> {
  for (const slug of EXPECTED_POST_SLUGS) {
    try {
      await deleteWhere(payload, req, 'posts', { slug: { equals: slug } })
    } catch {
      /* */
    }
  }
}

async function deleteFormsScope({ payload, req }: AdminSession): Promise<void> {
  for (const title of EXPECTED_FORM_TITLES) {
    try {
      await deleteWhere(payload, req, 'forms', { title: { equals: title } })
    } catch {
      /* */
    }
  }
}

async function deletePagesScope({ payload, req }: AdminSession): Promise<void> {
  for (const slug of EXPECTED_PAGE_SLUGS) {
    try {
      await deleteWhere(payload, req, 'pages', { slug: { equals: slug } })
    } catch {
      /* */
    }
  }
}

async function deleteOpsScope({ payload, req }: AdminSession): Promise<void> {
  for (const title of EXPECTED_GROWTH_MILESTONE_TITLES) {
    try {
      await deleteWhere(payload, req, 'growth-milestones', { title: { equals: title } })
    } catch {
      /* */
    }
  }
  for (const label of EXPECTED_ASSET_LADDER_LABELS) {
    try {
      await deleteWhere(payload, req, 'ops-asset-ladder-items', { label: { equals: label } })
    } catch {
      /* */
    }
  }
  for (const label of EXPECTED_LIABILITY_LABELS) {
    try {
      await deleteWhere(payload, req, 'ops-liability-items', { label: { equals: label } })
    } catch {
      /* */
    }
  }
  for (const title of EXPECTED_SCORECARD_TITLES) {
    try {
      await deleteWhere(payload, req, 'ops-scorecard-rows', { title: { equals: title } })
    } catch {
      /* */
    }
  }
}

async function deleteCrmScope({ payload, req }: AdminSession): Promise<void> {
  for (const key of EXPECTED_CRM_SEQUENCE_KEYS) {
    try {
      await deleteWhere(payload, req, 'crm-sequences', { key: { equals: key } })
    } catch {
      /* */
    }
  }
}

async function deleteFoundationPreviewOnly({ payload, req }: AdminSession): Promise<void> {
  const previewEmail = portalPreviewTestUserEmail()
  try {
    await deleteWhere(payload, req, 'users', { email: { equals: previewEmail } })
  } catch {
    /* */
  }
}

/**
 * When deleting `all`, run in an order that clears dependents before parents (best effort).
 * `globals` is omitted — handled as skipped in `runSeedDelete`.
 */
const DELETE_SCOPE_ORDER: readonly SeedScopeDeletable[] = [
  'demo',
  'crm',
  'ops',
  'forms',
  'posts',
  'pages',
  'taxonomy',
  'media',
  'foundation',
]

const DELETE_HANDLERS: Record<SeedScope, (s: AdminSession) => Promise<void>> = {
  foundation: deleteFoundationPreviewOnly,
  media: deleteMediaScope,
  taxonomy: deleteTaxonomyScope,
  posts: deletePostsScope,
  forms: deleteFormsScope,
  pages: deletePagesScope,
  globals: async () => {
    /* Globals are singleton config — not deleted; use push to reset. */
  },
  ops: deleteOpsScope,
  crm: deleteCrmScope,
  demo: async (session) => {
    await purgeDemoSeedFixtures({ payload: session.payload, req: session.req })
  },
}

export type SeedDeleteResult = {
  scopes: SeedScope[]
  skippedGlobals: boolean
  /** True when only `globals` (or empty effective set) — no collection deletes ran */
  noop: boolean
}

/**
 * Remove documents keyed like repository seed (destructive). Staff admin users are never removed.
 * `foundation` only removes the seeded preview portal customer. `globals` is a no-op.
 * Uses **requested** scopes only for single-scope deletes (no dependency expansion — `delete globals` does not delete pages).
 */
export async function runSeedDelete(
  session: AdminSession,
  domainArg: string,
): Promise<SeedDeleteResult> {
  const requested: SeedScope[] =
    domainArg === SEED_SCOPE_ALL ? [...ALL_SEED_SCOPES] : parseSeedDomainArg(domainArg)

  const skippedGlobals = requested.includes('globals')
  const effective = requested.filter((s): s is SeedScopeDeletable => s !== 'globals')
  const effectiveSet = new Set(effective)

  const ordered: SeedScope[] =
    domainArg === SEED_SCOPE_ALL
      ? DELETE_SCOPE_ORDER.filter((s) => effectiveSet.has(s))
      : [...effective]

  for (const scope of ordered) {
    await DELETE_HANDLERS[scope](session)
  }

  return { scopes: requested, skippedGlobals, noop: effective.length === 0 }
}
