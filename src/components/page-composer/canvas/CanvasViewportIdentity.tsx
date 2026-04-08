'use client'

import { Badge } from '@/components/ui/badge'
import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { cn } from '@/utilities/ui'

export function CanvasViewportIdentity({
  breadcrumbs,
  dirty,
  pagePath,
  selectedSummaryLabel,
  toolbarState,
}: {
  breadcrumbs: string[]
  dirty: boolean
  pagePath: string
  selectedSummaryLabel: string
  toolbarState: null | {
    draftPage?: null | {
      _status?: null | string
    }
  }
}) {
  return (
    <div className="grid gap-1">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className={cn('flex flex-wrap items-center gap-2', adminPanelChrome.fieldLabelTight)}>
          <span>Composer canvas bar</span>

        </div>
        {toolbarState?.draftPage ? <Badge variant="secondary">{pagePath}</Badge> : null}
        {toolbarState?.draftPage ? <Badge variant="outline">{toolbarState.draftPage._status || 'draft'}</Badge> : null}
        {dirty ? <Badge>Unsaved</Badge> : null}
      </div>
    </div>
  )
}
