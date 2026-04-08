'use client'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { pageSlugToFrontendPath } from '@/lib/pages/pageComposer'

export function PageComposerDrawerPublishRouteCard({
  slugDraft,
  visibilityDraft,
}: {
  slugDraft: string
  visibilityDraft: 'private' | 'public'
}) {
  return (
    <div className={adminPanelChrome.card}>
      <div className={adminPanelChrome.fieldLabel}>Route</div>
      <div className="mt-2 text-sm font-semibold text-foreground">{pageSlugToFrontendPath(slugDraft)}</div>
      <div className="mt-1 text-xs text-muted-foreground">
        {visibilityDraft === 'private' ? 'Private until you change visibility.' : 'Public when published.'}
      </div>
    </div>
  )
}
