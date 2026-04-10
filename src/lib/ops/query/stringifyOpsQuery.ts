import type { OpsSectionId } from '@/lib/ops/uiMeta'
import { OPS_WORKSPACE_PATH } from '@/lib/navigation/portalPaths'

/** Preserve existing workspace query params; set or replace `tab`. */
export function buildOpsTabUrl(
  currentQuery: URLSearchParams | string,
  tab: OpsSectionId,
): string {
  const params = new URLSearchParams(
    typeof currentQuery === 'string' ? currentQuery : currentQuery.toString(),
  )

  params.set('tab', tab)
  return `${OPS_WORKSPACE_PATH}?${params.toString()}`
}
