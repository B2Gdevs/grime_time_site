'use client'

import { ExternalLinkIcon, XIcon } from 'lucide-react'

import { CanvasActionButton } from './CanvasPrimitives'
import { Button } from '@/components/ui/button'
import type { PageComposerCanvasMode } from '@/components/admin-impersonation/PageComposerContext'

import { CanvasViewportModeStrip } from './CanvasViewportModeStrip'

export function CanvasViewportActions({
  onClose,
  onSetPreviewMode,
  previewMode,
  previewPath,
}: {
  onClose: () => void
  onSetPreviewMode: (mode: PageComposerCanvasMode) => void
  previewMode: PageComposerCanvasMode
  previewPath: string
}) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-2">
      <Button asChild className="h-10 rounded-xl" type="button" variant="outline">
        <a aria-label="Open route preview" className="inline-flex items-center gap-2" href={previewPath} rel="noreferrer" target="_blank">
          Preview
          <ExternalLinkIcon className="h-4 w-4 shrink-0" />
        </a>
      </Button>
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
