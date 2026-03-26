import type { CrmRecordDetail } from '@/lib/crm/workspace'

import type { DetailState } from '@/components/portal/command-center/types'

export function crmDetailToPanelState(
  detail: CrmRecordDetail,
  reloadDetail?: (() => Promise<DetailState | null>) | null,
): DetailState {
  return {
    crmDetail: detail,
    description: detail.subtitle,
    kind: 'crm',
    reloadDetail: reloadDetail ?? null,
    title: detail.title,
  }
}
