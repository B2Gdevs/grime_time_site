import path from 'node:path'

import type { SeedScope } from '@/endpoints/seed/scopes'

/** Repository-relative root for seed TypeScript and fixtures. */
export const SEED_ROOT_RELATIVE = path.join('src', 'endpoints', 'seed')

/**
 * Source files that define or support each seed scope (for `grimetime seed list`).
 * Paths are POSIX-style from repo root; align with imports in `orchestrate-push.ts`.
 */
export const SCOPE_SOURCE_FILES: Record<SeedScope, readonly string[]> = {
  foundation: [
    'src/endpoints/seed/orchestrate-push.ts',
    'src/utilities/quotesAccess.ts',
    'src/lib/brand/emailDefaults.ts',
    'src/lib/auth/previewIdentity.ts',
  ],
  media: [
    'src/endpoints/seed/orchestrate-push.ts',
    'src/endpoints/seed/upsert.ts',
    'src/endpoints/seed/image-1.ts',
    'src/endpoints/seed/image-2.ts',
    'src/endpoints/seed/image-seed-driveway.ts',
    'src/endpoints/seed/image-seed-house.ts',
    'src/endpoints/seed/image-seed-property.ts',
  ],
  taxonomy: ['src/endpoints/seed/orchestrate-push.ts', 'src/endpoints/seed/upsert.ts'],
  posts: [
    'src/endpoints/seed/orchestrate-push.ts',
    'src/endpoints/seed/post-1.ts',
    'src/endpoints/seed/post-2.ts',
    'src/endpoints/seed/post-3.ts',
  ],
  forms: [
    'src/endpoints/seed/orchestrate-push.ts',
    'src/endpoints/seed/contact-form.ts',
    'src/endpoints/seed/instant-quote-form.ts',
    'src/endpoints/seed/schedule-request-form.ts',
  ],
  pages: [
    'src/endpoints/seed/orchestrate-push.ts',
    'src/endpoints/seed/home.ts',
    'src/endpoints/seed/contact-page.ts',
    'src/endpoints/seed/about-page.ts',
    'src/endpoints/seed/public-support-pages.ts',
  ],
  globals: [
    'src/endpoints/seed/orchestrate-push.ts',
    'src/lib/quotes/instantQuoteCatalog.ts',
  ],
  ops: [
    'src/endpoints/seed/orchestrate-push.ts',
    'src/lib/ops/businessOperatingSystem.ts',
  ],
  crm: ['src/endpoints/seed/orchestrate-push.ts', 'src/endpoints/seed/crm-sequences.ts'],
  demo: [
    'src/endpoints/seed/demo-seed.ts',
    'src/endpoints/seed/demo-personas.ts',
  ],
}

/** Payload collection slugs primarily touched per scope (summary / orientation). */
export const SCOPE_PRIMARY_COLLECTIONS: Record<SeedScope, string> = {
  foundation: 'users',
  media: 'media',
  taxonomy: 'categories',
  posts: 'posts',
  forms: 'forms',
  pages: 'pages',
  globals: 'globals (header, footer, quoteSettings, …)',
  ops: 'growth-milestones, ops-*, ops-scorecard-rows',
  crm: 'crm-sequences',
  demo: 'accounts, users, jobs, quotes, …',
}

export function listSourceFilesForScopes(scopes: SeedScope[]): string[] {
  const set = new Set<string>()
  for (const s of scopes) {
    for (const f of SCOPE_SOURCE_FILES[s]) set.add(f)
  }
  return [...set].sort()
}

export function fileCountForScope(scope: SeedScope): number {
  return SCOPE_SOURCE_FILES[scope].length
}
