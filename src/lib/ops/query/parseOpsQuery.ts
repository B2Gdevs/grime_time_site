import { OPS_SECTION_IDS, type OpsSectionId } from '@/lib/ops/uiMeta'

const OPS_SECTION_ID_SET = new Set<string>(OPS_SECTION_IDS)

export function parseOpsTabQuery(raw: string | undefined): OpsSectionId | null {
  if (!raw || !OPS_SECTION_ID_SET.has(raw)) {
    return null
  }

  return raw as OpsSectionId
}
