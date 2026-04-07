'use client'

import { Badge } from '@/components/ui/badge'
import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'

export function PageComposerDrawerMediaSectionHeader({
  mediaSlots,
  selectedHeading,
}: {
  mediaSlots: number
  selectedHeading: string
}) {
  return (
    <div className={adminPanelChrome.card}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-foreground">{selectedHeading || 'Service section'}</div>
        <Badge variant="outline">serviceGrid media</Badge>
        <Badge variant="secondary">{mediaSlots} slots</Badge>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Choose a row, then upload, generate, or swap from recent media without leaving the page.
      </div>
    </div>
  )
}
