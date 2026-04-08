'use client'

import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { cn } from '@/utilities/ui'

export function CanvasViewportDraftToolbar({
  toolbarState,
}: {
  toolbarState: {
    canResetDraft: boolean
    draftToolbarBusy: boolean
    draftToolbarStatusLabel: null | string
    onResetDraft: () => void
  }
}) {
  if (toolbarState.draftToolbarBusy) {
    return (
      <div
        className={cn(
          adminPanelChrome.segmentedControlBar,
          'h-8 min-w-[9rem] items-center justify-center gap-2 px-2.5',
        )}
        role="status"
        aria-live="polite"
      >
        <Loader2Icon aria-hidden className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {toolbarState.draftToolbarStatusLabel ?? 'Working…'}
        </span>
      </div>
    )
  }

  if (!toolbarState.canResetDraft) {
    return null
  }

  return (
    <Button
      className="h-8 rounded-xl"
      onClick={toolbarState.onResetDraft}
      type="button"
      variant="outline"
    >
      Reset
    </Button>
  )
}
