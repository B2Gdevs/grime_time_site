'use client'

import { CopyPlusIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Button } from '@/components/ui/button'

export function PageComposerDrawerLinkedReusablePresetPanel({
  detachReusableBlock,
  openBlockLibrary,
  removeBlock,
  selectedIndex,
}: {
  detachReusableBlock: (index: number) => void
  openBlockLibrary: (index: number, mode?: 'insert' | 'replace') => void
  removeBlock: (index: number) => void
  selectedIndex: number
}) {
  return (
    <div className="grid gap-4">
      <div className={adminPanelChrome.calloutPrimary}>
        This block is using a linked reusable preset. Detach it before editing local copy, or replace it with another reusable source.
        <div className="mt-3 flex flex-wrap gap-2">
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
    </div>
  )
}
