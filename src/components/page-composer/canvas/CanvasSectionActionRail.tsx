'use client'

import { useState } from 'react'
import { ArrowDownIcon, ArrowUpIcon, CopyPlusIcon, EyeIcon, EyeOffIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import { CanvasActionButton } from './CanvasActionButton'
import type { PageComposerToolbarState } from '@/components/page-composer/PageComposerContext'
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
  const [insertPickerOpen, setInsertPickerOpen] = useState(false)
  const heroPinnedAtTop = toolbarState.sectionSummaries[0]?.blockType === 'heroBlock'
  const canMoveUp = supportsInsertionAbove && !(heroPinnedAtTop && sectionSummary.index <= 1)
  const canMoveDown = !(heroPinnedAtTop && sectionSummary.blockType === 'heroBlock' && sectionSummary.index === 0)

  return (
    <div
      className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex min-h-10 items-end justify-center opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
      data-page-composer-action-rail="true"
      data-page-composer-interactive="true"
    >
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-[1.1rem] border border-border/70 bg-background/94 p-2 shadow-lg backdrop-blur transition-transform duration-200 group-hover:-translate-y-1 group-focus-within:-translate-y-1">
        {canMoveUp ? (
          <CanvasActionButton
            label="Move block up"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setInsertPickerOpen(false)
              toolbarState.onMoveUp(sectionSummary.identity)
            }}
          >
            <ArrowUpIcon className="h-4 w-4" />
          </CanvasActionButton>
        ) : null}
        {canMoveDown ? (
          <CanvasActionButton
            label="Move block down"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setInsertPickerOpen(false)
              toolbarState.onMoveDown(sectionSummary.identity)
            }}
          >
            <ArrowDownIcon className="h-4 w-4" />
          </CanvasActionButton>
        ) : null}
        <div className="relative">
          <CanvasActionButton
            label="Add block"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setInsertPickerOpen((current) => !current)
            }}
          >
            <PlusIcon className="h-4 w-4" />
          </CanvasActionButton>
          {insertPickerOpen ? (
            <div
              className="absolute bottom-full left-1/2 z-30 mb-2 flex -translate-x-1/2 gap-2 rounded-[1rem] border border-border/70 bg-background/96 p-2 shadow-lg backdrop-blur animate-[page-composer-picker-in_180ms_cubic-bezier(0.22,1,0.36,1)]"
              data-page-composer-action-rail="true"
            >
              {supportsInsertionAbove ? (
                <CanvasActionButton
                  label="Add block above"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setInsertPickerOpen(false)
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
                  setInsertPickerOpen(false)
                  toolbarState.onAddBelow(index)
                }}
              >
                <ArrowDownIcon className="h-4 w-4" />
              </CanvasActionButton>
            </div>
          ) : null}
        </div>
        {isLayoutBlock ? (
          <>
            <CanvasActionButton
              label={sectionSummary.hidden ? 'Show block' : 'Hide block'}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setInsertPickerOpen(false)
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
                setInsertPickerOpen(false)
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
                setInsertPickerOpen(false)
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
