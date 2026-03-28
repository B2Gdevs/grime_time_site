import type { OpsSectionId } from '@/lib/ops/uiMeta'

/** Preserve existing workspace query params; set or replace `tab`. */
export function buildOpsTabUrl(
  currentQuery: URLSearchParams | string,
  tab: OpsSectionId,
): string {
  const params = new URLSearchParams(
    typeof currentQuery === 'string' ? currentQuery : currentQuery.toString(),
  )

  params.set('tab', tab)
  return `/ops/workspace?${params.toString()}`
}
