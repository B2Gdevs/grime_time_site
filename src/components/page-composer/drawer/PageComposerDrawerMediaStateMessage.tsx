'use client'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import type { MediaSectionSummary } from '@/components/page-composer/drawer/PageComposerDrawerMediaTypes'

export function PageComposerDrawerMediaStateMessage({
  draftPage,
  loading,
  selectedIndex: _selectedIndex,
  selectedServiceGrid,
}: {
  draftPage: null | { pagePath: string }
  loading: boolean
  selectedIndex: number
  selectedServiceGrid: MediaSectionSummary
}) {
  if (loading) {
    return <div className={adminPanelChrome.panelEmptyMuted}>Loading section media...</div>
  }

  if (!draftPage) {
    return <div className={adminPanelChrome.panelEmptyMuted}>No page is available for this route.</div>
  }

  if (!selectedServiceGrid) {
    return (
      <div className={adminPanelChrome.panelEmptyMuted}>
        This first media editor is focused on `serviceGrid` rows. Other media relationships still use the existing page media tools while the unified composer expands.
      </div>
    )
  }

  return null
}
