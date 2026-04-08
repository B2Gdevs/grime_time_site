'use client'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'

export function PageComposerDrawerPublishDraftCard({
  changedBlockCount,
  dirty,
  sectionCount,
}: {
  changedBlockCount: number
  dirty: boolean
  sectionCount: number
}) {
  return (
    <div className={adminPanelChrome.card}>
      <div className={adminPanelChrome.fieldLabel}>Current draft</div>
      <div className="mt-2 text-sm font-semibold text-foreground">
        {dirty ? 'Unsaved changes ready to review.' : 'Draft matches the last saved state.'}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {sectionCount} block{sectionCount === 1 ? '' : 's'} in this page · {changedBlockCount} changed block
        {changedBlockCount === 1 ? '' : 's'}.
      </div>
    </div>
  )
}
