'use client'

import { useState } from 'react'
import { Trash2Icon, XIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import type {
  PageComposerCanvasMode,
  PageComposerToolbarState,
} from '@/components/page-composer/PageComposerContext'
import { TypePathConfirmDialog } from '@/components/admin-impersonation/TypePathConfirmDialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utilities/ui'

import { CanvasActionButton } from './CanvasActionButton'
import { CanvasViewportModeStrip } from './CanvasViewportModeStrip'

function resolveDeleteDraftTooltip(toolbarState: null | PageComposerToolbarState): string {
  const p = toolbarState?.draftPage
  if (!p) return 'Delete draft page'
  if (typeof p.id !== 'number') return 'Save a draft before you can delete this page'
  if (p._status === 'published') return "Published pages can't be deleted here"
  return 'Delete draft page and return home'
}

export function CanvasViewportActions({
  onClose,
  onSetPreviewMode,
  previewMode,
  toolbarState,
}: {
  onClose: () => void
  onSetPreviewMode: (mode: PageComposerCanvasMode) => void
  previewMode: PageComposerCanvasMode
  toolbarState: null | PageComposerToolbarState
}) {
  const canDelete = toolbarState?.canDeleteDraftPage ?? false
  const busy = toolbarState?.deleteDraftPageBusy ?? false
  const onDelete = toolbarState?.onDeleteDraftPage
  const deleteTooltip = resolveDeleteDraftTooltip(toolbarState)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const expectedPath = toolbarState?.draftPage?.pagePath?.trim() ?? ''

  return (
    <div className="flex shrink-0 items-center justify-end gap-2">
      <TypePathConfirmDialog
        busy={busy}
        confirmButtonLabel="Delete draft"
        description={
          <span className="block">
            This removes the draft page from the CMS. You cannot undo it. After deletion you will be taken to the home page.
          </span>
        }
        expectedPath={expectedPath}
        onConfirm={() => onDelete?.()}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Delete this draft?"
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <button
              aria-label={deleteTooltip}
              className={cn(
                adminPanelChrome.canvasToolbarIconButton,
                (!canDelete || busy) && 'opacity-40',
              )}
              data-page-composer-interactive="true"
              disabled={!canDelete || busy}
              onClick={(event) => {
                event.preventDefault()
                if (!canDelete || busy) {
                  return
                }
                setDeleteDialogOpen(true)
              }}
              type="button"
            >
              <Trash2Icon className="h-4 w-4" />
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{deleteTooltip}</TooltipContent>
      </Tooltip>

      <CanvasViewportModeStrip activeMode={previewMode} onSetMode={onSetPreviewMode} />
      <CanvasActionButton
        label="Close composer"
        onClick={(event) => {
          event.preventDefault()
          onClose()
        }}
      >
        <XIcon className="h-4 w-4" />
      </CanvasActionButton>
    </div>
  )
}
