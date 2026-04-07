'use client'

import { CopyPlusIcon, EyeIcon, EyeOffIcon, Trash2Icon } from 'lucide-react'

import { CanvasActionButton } from './CanvasPrimitives'
import type { PageComposerToolbarState } from '@/components/admin-impersonation/PageComposerContext'
import type { PageComposerSectionSummary } from '@/lib/pages/pageComposer'

export function CanvasSectionActionRail({
  index,
  sectionSummary,
  toolbarState,
}: {
  index: number
  sectionSummary: PageComposerSectionSummary
  toolbarState: PageComposerToolbarState
}) {
  return (
    <div
      className="pointer-events-none absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
      data-page-composer-interactive="true"
    >
      <div className="pointer-events-auto flex flex-col gap-2 rounded-[1.1rem] border border-border/70 bg-background/94 p-2 shadow-lg backdrop-blur">
        <CanvasActionButton
          label={sectionSummary.hidden ? 'Show block' : 'Hide block'}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            toolbarState.onToggleHidden(index)
          }}
        >
          {sectionSummary.hidden ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
        </CanvasActionButton>
        <CanvasActionButton
          label="Duplicate block"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            toolbarState.onDuplicateBlock(index)
          }}
        >
          <CopyPlusIcon className="h-4 w-4" />
        </CanvasActionButton>
        <CanvasActionButton
          className="border-destructive/30 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
          label="Delete block"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            toolbarState.onDeleteBlock(index)
          }}
        >
          <Trash2Icon className="h-4 w-4" />
        </CanvasActionButton>
      </div>
    </div>
  )
}
