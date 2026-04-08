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
  onRemoveBlock,
  openBlockLibrary,
  selectedBlockType,
  selectedIndex,
  selectedSummary,
}: {
  children?: ReactNode
  onRemoveBlock?: (index: number) => void
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
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => openBlockLibrary(selectedIndex, 'replace')} size="sm" type="button" variant="outline">
            Find blocks
          </Button>
          <Button onClick={() => openBlockLibrary(selectedIndex + 1, 'insert')} size="sm" type="button" variant="secondary">
            Add below
          </Button>
          {onRemoveBlock ? (
            <Button onClick={() => onRemoveBlock(selectedIndex)} size="sm" type="button" variant="ghost">
              Remove block
            </Button>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  )
}
