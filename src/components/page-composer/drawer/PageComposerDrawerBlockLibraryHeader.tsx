'use client'

import { XIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Button } from '@/components/ui/button'

export function PageComposerDrawerBlockLibraryHeader({
  blockLibraryMode,
  blockLibraryTargetIndex,
  closeBlockLibrary,
}: {
  blockLibraryMode: 'insert' | 'replace'
  blockLibraryTargetIndex: null | number
  closeBlockLibrary: () => void
}) {
  return (
    <div className={adminPanelChrome.drawerHeaderBetweenStart}>
      <div className="min-w-0 flex-1">
        <div className="text-lg font-semibold text-foreground">Blocks</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {blockLibraryMode === 'replace'
            ? `Replace block ${Math.max(1, (blockLibraryTargetIndex ?? 0) + 1)} with another layout, preset, or shared source.`
            : `Insert a block at position ${(blockLibraryTargetIndex ?? 0) + 1}.`}
        </div>
      </div>
      <Button aria-label="Close block library" onClick={closeBlockLibrary} size="icon" type="button" variant="ghost">
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
