'use client'

import { Link2Icon, TypeIcon } from 'lucide-react'

import { CanvasToolbarField } from './CanvasPrimitives'
import { CanvasViewportCreateDraftButton } from './CanvasViewportCreateDraftButton'
import { CanvasViewportPublishButton } from './CanvasViewportPublishButton'
import { CanvasViewportRouteState } from './CanvasViewportRouteState'
import { CanvasViewportVisibilityToggle } from './CanvasViewportVisibilityToggle'

export function CanvasViewportDraftFields({
  isPublishTabActive,
  onOpenPublish,
  toolbarState,
}: {
  isPublishTabActive: boolean
  onOpenPublish: null | (() => void)
  toolbarState: null | {
    creatingDraftClone: boolean
    dirty: boolean
    draftPage?: null | {
      _status?: null | string
      id?: null | number
    }
    loading: boolean
    onCreateDraft: () => void
    onSetSlugDraft: (value: string) => void
    onSetTitleDraft: (value: string) => void
    onSetVisibilityDraft: (value: 'private' | 'public') => void
    slugDraft: string
    titleDraft: string
    visibilityDraft: 'private' | 'public'
  }
}) {
  if (!toolbarState) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CanvasToolbarField
        className="min-w-0 flex-[1.3_1_16rem]"
        icon={<TypeIcon className="h-4 w-4" />}
        onChange={toolbarState.onSetTitleDraft}
        placeholder="Page title"
        value={toolbarState.titleDraft}
      />
      <CanvasToolbarField
        className="min-w-0 flex-[0.8_1_12rem]"
        icon={<Link2Icon className="h-4 w-4" />}
        onChange={toolbarState.onSetSlugDraft}
        placeholder="page-slug"
        value={toolbarState.slugDraft}
      />
      <CanvasViewportRouteState toolbarState={toolbarState} />
      <CanvasViewportCreateDraftButton toolbarState={toolbarState} />
      <CanvasViewportPublishButton
        isPublishTabActive={isPublishTabActive}
        onOpenPublish={onOpenPublish}
        toolbarState={toolbarState}
      />
      <CanvasViewportVisibilityToggle toolbarState={toolbarState} />
    </div>
  )
}
