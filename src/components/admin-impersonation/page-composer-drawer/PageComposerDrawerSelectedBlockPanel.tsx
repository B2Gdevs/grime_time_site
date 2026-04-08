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
            ? 'Hero editing happens directly on the page. This drawer stays focused on finding, replacing, and arranging sections.'
            : 'Edit copy directly on the live canvas. Use this block surface to replace the current section with a different layout, preset, or shared source.'}
        </div>
        <div className="mt-3">
          <Button disabled={selectedIndex < 0} onClick={() => openBlockLibrary(selectedIndex, 'replace')} size="sm" type="button" variant="outline">
            Find blocks
          </Button>
        </div>
      </div>
    </div>
  )
}

