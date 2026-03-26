import { Card, CardContent } from '@/components/ui/card'
import { CrmCommandCenterDetail } from '@/components/portal/crm/CrmCommandCenterDetail'

import type { DetailState } from './types'

export function CommandCenterDetailPanel({
  detail,
  setDetail,
}: {
  detail: DetailState
  setDetail: (value: DetailState) => void
}) {
  if (detail.kind === 'crm' && detail.crmDetail) {
    return (
      <CardContent className="min-w-0">
        <CrmCommandCenterDetail detail={detail.crmDetail} reloadDetail={detail.reloadDetail} setDetail={setDetail} />
      </CardContent>
    )
  }

  return (
    <CardContent className="grid gap-4">
      <div className="rounded-2xl border bg-muted/20 p-4">
        <div className="mb-2">
          <p className="text-sm font-medium">{detail.title}</p>
          {detail.description ? <p className="text-xs text-muted-foreground">{detail.description}</p> : null}
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{detail.body ?? ''}</div>
      </div>
    </CardContent>
  )
}
