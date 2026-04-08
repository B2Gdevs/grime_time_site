'use client'

import { ArrowDownIcon, ArrowUpIcon, CopyPlusIcon, EyeIcon, EyeOffIcon, Trash2Icon } from 'lucide-react'

import { CanvasActionButton } from './CanvasActionButton'
import type { PageComposerToolbarState } from '@/components/admin-impersonation/PageComposerContext'
import type { PageComposerSectionSummary } from '@/lib/pages/pageComposer'

export function CanvasSectionActionRail({
  index,
  sectionSummary,
  supportsInsertionAbove,
  toolbarState,
}: {
  index: number
  sectionSummary: PageComposerSectionSummary
  supportsInsertionAbove: boolean
  toolbarState: PageComposerToolbarState
}) {
  const isLayoutBlock = index >= 0

  return (
    <div
      className="pointer-events-none absolute inset-x-3 top-3 z-20 flex min-h-10 items-start opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
      data-page-composer-interactive="true"
    >
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-[1.1rem] border border-border/70 bg-background/94 p-2 shadow-lg backdrop-blur">
        {supportsInsertionAbove ? (
          <CanvasActionButton
            label="Add block above"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              toolbarState.onAddAbove(index)
            }}
          >
            <ArrowUpIcon className="h-4 w-4" />
          </CanvasActionButton>
        ) : null}
        <CanvasActionButton
          label="Add block below"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            toolbarState.onAddBelow(index)
          }}
        >
          <ArrowDownIcon className="h-4 w-4" />
        </CanvasActionButton>
        {isLayoutBlock ? (
          <>
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
          </>
        ) : null}
      </div>
    </div>
  )
}
