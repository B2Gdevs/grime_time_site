'use client'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'

export function CanvasViewportVisibilityToggle({
  toolbarState,
}: {
  toolbarState: {
    onSetVisibilityDraft: (value: 'private' | 'public') => void
    visibilityDraft: 'private' | 'public'
  }
}) {
  return (
    <div className={adminPanelChrome.segmentedControlBar}>
      <button
        className={`rounded-lg px-3 text-sm transition ${
          toolbarState.visibilityDraft === 'public'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => toolbarState.onSetVisibilityDraft('public')}
        type="button"
      >
        Public
      </button>
      <button
        className={`rounded-lg px-3 text-sm transition ${
          toolbarState.visibilityDraft === 'private'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => toolbarState.onSetVisibilityDraft('private')}
        type="button"
      >
        Private
      </button>
    </div>
  )
}
