'use client'

import { Link2Icon, TypeIcon } from 'lucide-react'

import type { PageComposerToolbarState } from '@/components/page-composer/PageComposerContext'
import { CanvasToolbarField } from './CanvasToolbarField'
import { CanvasViewportDraftToolbar } from './CanvasViewportDraftToolbar'
import { CanvasViewportVisibilityToggle } from './CanvasViewportVisibilityToggle'

export function CanvasViewportDraftFields({
  isPublishTabActive,
  onOpenPublish,
  toolbarState,
}: {
  isPublishTabActive: boolean
  onOpenPublish: null | (() => void)
  toolbarState: null | PageComposerToolbarState
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
      <CanvasViewportDraftToolbar toolbarState={toolbarState} />
      <CanvasViewportVisibilityToggle toolbarState={toolbarState} />
    </div>
  )
}
