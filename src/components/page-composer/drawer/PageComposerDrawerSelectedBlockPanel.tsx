'use client'

import type { ReactNode } from 'react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Button } from '@/components/ui/button'
import type { PageComposerSectionSummary } from '@/lib/pages/pageComposer'

function blockPanelDescription(blockType: null | string): string {
  if (
    blockType === 'archive' ||
    blockType === 'contactRequest' ||
    blockType === 'formBlock' ||
    blockType === 'serviceEstimator'
  ) {
    return 'This block is code-owned app functionality. Replace it here, but use the live surface or app-specific settings for the experience itself.'
  }

  return 'Edit the selected block data here, or replace the current section with a different layout, preset, or shared source.'
}

export function PageComposerDrawerSelectedBlockPanel({
  children,
  openBlockLibrary,
  selectedBlockType,
  selectedIndex,
  selectedSummary,
}: {
  children?: ReactNode
  openBlockLibrary: (index: number, mode?: 'insert' | 'replace') => void
  selectedBlockType?: null | string
  selectedIndex: number
  selectedSummary: null | PageComposerSectionSummary
}) {
  return (
    <div className="grid gap-4">
      <div className={adminPanelChrome.card}>
        <div className="text-sm font-semibold text-foreground">{selectedSummary?.label || 'Selected block'}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {blockPanelDescription(selectedBlockType || selectedSummary?.blockType || null)}
        </div>
        <div className="mt-3">
          <Button onClick={() => openBlockLibrary(selectedIndex, 'replace')} size="sm" type="button" variant="outline">
            Find blocks
          </Button>
        </div>
      </div>
      {children}
    </div>
  )
}
