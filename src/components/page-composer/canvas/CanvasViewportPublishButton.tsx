'use client'

import { Button } from '@/components/ui/button'

export function CanvasViewportPublishButton({
  isPublishTabActive,
  onOpenPublish,
  toolbarState,
}: {
  isPublishTabActive: boolean
  onOpenPublish: null | (() => void)
  toolbarState: {
    draftPage?: null | {
      _status?: null | string
    }
  }
}) {
  return (
    <Button
      className="h-10 rounded-xl"
      onClick={() => {
        onOpenPublish?.()
      }}
      type="button"
      variant={isPublishTabActive ? 'default' : 'outline'}
    >
      {toolbarState.draftPage?._status === 'published' ? 'Published' : 'Draft'}
    </Button>
  )
}
