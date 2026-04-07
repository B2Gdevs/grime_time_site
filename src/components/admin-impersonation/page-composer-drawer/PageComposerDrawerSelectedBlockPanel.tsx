'use client'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Button } from '@/components/ui/button'
import type { PageComposerSectionSummary } from '@/lib/pages/pageComposer'

export function PageComposerDrawerSelectedBlockPanel({
  openBlockLibrary,
  selectedIndex,
  selectedSummary,
}: {
  openBlockLibrary: (index: number, mode?: 'insert' | 'replace') => void
  selectedIndex: number
  selectedSummary: null | PageComposerSectionSummary
}) {
  return (
    <div className="grid gap-4">
      <div className={adminPanelChrome.card}>
        <div className="text-sm font-semibold text-foreground">{selectedSummary?.label || 'Selected block'}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {selectedIndex < 0
            ? 'Hero editing now happens directly on the page. Use the live canvas copy and media affordances instead of this side surface.'
            : 'This first content editor is focused on reusable `serviceGrid` sections. Other block types can still be replaced, reordered, duplicated, and removed while the shared-section authoring surface expands.'}
        </div>
        <div className="mt-3">
          <Button disabled={selectedIndex < 0} onClick={() => openBlockLibrary(selectedIndex, 'replace')} size="sm" type="button" variant="outline">
            Replace section
          </Button>
        </div>
      </div>
    </div>
  )
}

