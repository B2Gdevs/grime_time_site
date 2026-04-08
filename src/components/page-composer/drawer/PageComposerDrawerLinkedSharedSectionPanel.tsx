'use client'

import { CopyPlusIcon, RefreshCwIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Button } from '@/components/ui/button'

export function PageComposerDrawerLinkedSharedSectionPanel({
  detachReusableBlock,
  openBlockLibrary,
  openSharedSectionSourceEditor,
  removeBlock,
  selectedIndex,
  selectedSharedSectionId,
}: {
  detachReusableBlock: (index: number) => void
  openBlockLibrary: (index: number, mode?: 'insert' | 'replace') => void
  openSharedSectionSourceEditor: (id: number) => void
  removeBlock: (index: number) => void
  selectedIndex: number
  selectedSharedSectionId: number
}) {
  return (
    <div className="grid gap-4">
      <div className={adminPanelChrome.calloutPrimary}>
        This block is linked to a shared section source. Edit the source in the dedicated shared-section editor or detach a local copy before changing page-only content.
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => openSharedSectionSourceEditor(selectedSharedSectionId)} size="sm" type="button">
            <SquarePenIcon className="h-4 w-4" />
            Edit source
          </Button>
          <Button onClick={() => detachReusableBlock(selectedIndex)} size="sm" type="button" variant="outline">
            <CopyPlusIcon className="h-4 w-4" />
            Detach copy
          </Button>
          <Button onClick={() => openBlockLibrary(selectedIndex, 'replace')} size="sm" type="button" variant="outline">
            <RefreshCwIcon className="h-4 w-4" />
            Replace section
          </Button>
          <Button onClick={() => removeBlock(selectedIndex)} size="sm" type="button" variant="outline">
            <Trash2Icon className="h-4 w-4" />
            Remove from page
          </Button>
        </div>
      </div>
      <div className={adminPanelChrome.cardMuted}>
        Publishing the shared source updates every linked published page using it. Removing this section here only removes this page instance. The source itself stays intact.
      </div>
    </div>
  )
}
