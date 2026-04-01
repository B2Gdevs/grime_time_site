import {
  expandScopes,
  parseSeedDomainArg,
  SEED_SCOPE_ALL,
  SEED_SCOPES,
  type SeedScope,
} from '@/endpoints/seed/scopes'

import {
  listSourceFilesForScopes,
  SCOPE_PRIMARY_COLLECTIONS,
} from './seed-scope-manifest'

function uniqueScopes(scopes: SeedScope[]): SeedScope[] {
  return [...new Set(scopes)]
}

export function parseOnlyScopes(raw: string | undefined): SeedScope[] {
  if (!raw?.trim()) {
    return []
  }

  const tokens = raw
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)

  if (tokens.length === 0) {
    return []
  }

  const invalid = tokens.filter((token) => !SEED_SCOPES.includes(token as SeedScope))
  if (invalid.length > 0) {
    throw new Error(
      `Unknown scope(s) in --only: ${invalid.join(', ')}. Expected: ${SEED_SCOPES.join(', ')}`,
    )
  }

  return uniqueScopes(tokens as SeedScope[])
}

export type ResolveSeedPlanInput = {
  scope: string
  only?: string
  baseline?: boolean
}

export type SeedPlanDetails = {
  baseline: boolean
  requestedScopes: SeedScope[]
  resolvedScopes: SeedScope[]
  selectedByOnly: boolean
  sourceFiles: string[]
  primaryCollections: Array<{ collection: string; scope: SeedScope }>
}

export function resolveSeedPlanDetails(input: ResolveSeedPlanInput): SeedPlanDetails {
  const requestedFromScope = parseSeedDomainArg(input.scope)
  const onlyScopes = parseOnlyScopes(input.only)
  const selectedByOnly = onlyScopes.length > 0

  if (selectedByOnly && input.scope !== SEED_SCOPE_ALL) {
    throw new Error(`--only can only be used with scope "${SEED_SCOPE_ALL}".`)
  }

  const requestedScopes = selectedByOnly ? onlyScopes : requestedFromScope
  const baseline = Boolean(input.baseline)
  const expanded = expandScopes(requestedScopes)
  const resolvedScopes = baseline ? expanded.filter((scope) => scope !== 'demo') : expanded
  const sourceFiles = listSourceFilesForScopes(resolvedScopes)
  const primaryCollections = resolvedScopes.map((scope) => ({
    collection: SCOPE_PRIMARY_COLLECTIONS[scope],
    scope,
  }))

  return {
    baseline,
    requestedScopes,
    resolvedScopes,
    selectedByOnly,
    sourceFiles,
    primaryCollections,
  }
}
