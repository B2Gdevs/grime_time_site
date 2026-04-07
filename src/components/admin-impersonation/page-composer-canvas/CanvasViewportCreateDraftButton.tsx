'use client'

import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function CanvasViewportCreateDraftButton({
  toolbarState,
}: {
  toolbarState: {
    creatingDraftClone: boolean
    dirty: boolean
    loading: boolean
    draftPage?: null | {
      id?: null | number
    }
    onCreateDraft: () => void
  }
}) {
  return (
    <Button
      className="h-10 rounded-xl"
      disabled={toolbarState.creatingDraftClone || toolbarState.loading || toolbarState.dirty || typeof toolbarState.draftPage?.id !== 'number'}
      onClick={toolbarState.onCreateDraft}
      type="button"
      variant="outline"
    >
      <PlusIcon className="h-4 w-4" />
      {toolbarState.creatingDraftClone ? 'Creating...' : 'Create draft'}
    </Button>
  )
}
