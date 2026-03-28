/**
 * Logical domains for modular seed (CLI + future HTTP). Order is execution order for `all`.
 * @see .planning/phases/09-seed-system-and-cli/PLAN.xml
 */
export const SEED_SCOPES = [
  'foundation',
  'media',
  'taxonomy',
  'posts',
  'forms',
  'pages',
  'globals',
  'ops',
  'crm',
  'demo',
] as const

export type SeedScope = (typeof SEED_SCOPES)[number]

/** `all` expands to every scope (demo still respects skipDemo in the runner). */
export const SEED_SCOPE_ALL = 'all' as const
export type SeedDomainArg = SeedScope | typeof SEED_SCOPE_ALL

export const ALL_SEED_SCOPES: readonly SeedScope[] = [...SEED_SCOPES]

/** Directed deps: pushing `globals` implies `pages`, `media`, `foundation`, etc. */
export const SCOPE_DEPS: Record<SeedScope, readonly SeedScope[]> = {
  foundation: [],
  media: ['foundation'],
  taxonomy: ['foundation'],
  posts: ['foundation', 'media'],
  forms: ['foundation'],
  pages: ['foundation', 'media'],
  globals: ['foundation', 'media', 'pages'],
  ops: ['foundation'],
  crm: ['foundation'],
  demo: ['foundation'],
}

export const SCOPE_DESCRIPTIONS: Record<SeedScope, string> = {
  foundation: 'Staff admin users, preview customer, remove template demo authors',
  media: 'Seed image uploads (posts, marketing pages)',
  taxonomy: 'Post categories',
  posts: 'Three blog posts + related links',
  forms: 'Contact, instant quote, schedule request forms',
  pages: 'Home, contact, about, policies, SLA (layout blocks)',
  globals: 'Header/footer nav, pricing, quote + service plan settings',
  ops: 'Growth milestones, asset inventory, liability checklist, scorecard rows',
  crm: 'Default CRM sequences (ops templates)',
  demo: 'Demo accounts, personas, CRM/billing fixtures (see demo-seed.ts)',
}

export function isSeedScope(s: string): s is SeedScope {
  return (SEED_SCOPES as readonly string[]).includes(s)
}

/** Topological closure: requested scopes + dependencies, in canonical `SEED_SCOPES` order. */
export function expandScopes(requested: SeedScope[]): SeedScope[] {
  const set = new Set<SeedScope>()
  const visit = (s: SeedScope) => {
    if (set.has(s)) return
    for (const d of SCOPE_DEPS[s]) visit(d)
    set.add(s)
  }
  for (const r of requested) visit(r)
  return SEED_SCOPES.filter((s) => set.has(s))
}

export function parseSeedDomainArg(raw: string): SeedScope[] {
  if (raw === SEED_SCOPE_ALL) return [...ALL_SEED_SCOPES]
  if (!isSeedScope(raw)) {
    throw new Error(`Unknown seed domain "${raw}". Expected: all | ${SEED_SCOPES.join(' | ')}`)
  }
  return [raw]
}
