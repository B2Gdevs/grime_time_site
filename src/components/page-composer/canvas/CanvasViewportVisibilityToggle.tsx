'use client'

import { useId } from 'react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { cn } from '@/utilities/ui'

export function CanvasViewportVisibilityToggle({
  toolbarState,
}: {
  toolbarState: {
    onSetVisibilityDraft: (value: 'private' | 'public') => void
    visibilityDraft: 'private' | 'public'
  }
}) {
  const id = useId()
  const isPublic = toolbarState.visibilityDraft === 'public'

  return (
    <div
      className={cn(
        adminPanelChrome.segmentedControlBar,
        'h-8 min-w-[7.25rem] gap-2 px-2.5 py-0',
        'items-center justify-between',
      )}
    >
      <Label className="cursor-pointer text-xs font-medium text-foreground" htmlFor={id}>
        {isPublic ? 'Public' : 'Private'}
      </Label>
      <Switch
        checked={isPublic}
        id={id}
        onCheckedChange={(on) => {
          toolbarState.onSetVisibilityDraft(on ? 'public' : 'private')
        }}
      />
    </div>
  )
}
