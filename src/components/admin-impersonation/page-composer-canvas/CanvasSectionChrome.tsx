'use client'

import { CopyPlusIcon, EyeIcon, EyeOffIcon, Trash2Icon } from 'lucide-react'
import type { MouseEvent, ReactNode, RefObject } from 'react'

import { CanvasActionButton, CanvasInsertHandle } from './CanvasPrimitives'
import type { PageComposerToolbarState } from '@/components/admin-impersonation/PageComposerContext'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'
import type { PageComposerSectionSummary } from '@/lib/pages/pageComposer'

type CanvasSectionChromeProps = {
  children: ReactNode
  index: number
  isSelected: boolean
  label: string
  sectionBadgeLabel: string
  sectionRef: RefObject<HTMLDivElement | null>
  sectionSummary: null | PageComposerSectionSummary
  supportsInsertionAbove: boolean
  toolbarState: null | PageComposerToolbarState
  onClickCapture: (event: MouseEvent<HTMLDivElement>) => void
}

function CanvasSectionSelectionChip({
  isSelected,
  label,
  sectionBadgeLabel,
}: {
  isSelected: boolean
  label: string
  sectionBadgeLabel: string
}) {
  return (
    <div
      className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full border border-border/70 bg-background/94 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-foreground shadow-lg opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-within:opacity-100 data-[selected=true]:opacity-0"
      data-selected={isSelected ? 'true' : 'false'}
    >
      <span className="text-primary">{sectionBadgeLabel}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-foreground">{label}</span>
    </div>
  )
}

function CanvasSectionSummaryBadges({
  sectionBadgeLabel,
  sectionSummary,
  toolbarState,
}: {
  sectionBadgeLabel: string
  sectionSummary: NonNullable<CanvasSectionChromeProps['sectionSummary']>
  toolbarState: NonNullable<CanvasSectionChromeProps['toolbarState']>
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-3 top-3 z-20 flex min-h-10 items-start gap-3 rounded-[1.2rem] border border-border/70 bg-background/94 px-3 py-2 shadow-lg opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-within:opacity-100"
      data-page-composer-interactive="true"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant="secondary">{sectionBadgeLabel}</Badge>
        <Badge variant="outline">{sectionSummary.blockType}</Badge>
        {sectionSummary.variant ? <Badge variant="outline">{sectionSummary.variant}</Badge> : null}
        {sectionSummary.badges
          .filter((badge) => badge !== sectionSummary.variant)
          .map((badge) => (
            <Badge key={`${sectionSummary.index}-${badge}`} variant={badge === 'reusable' ? 'secondary' : 'outline'}>
              {badge}
            </Badge>
          ))}
      </div>
      {toolbarState.dirty ? <Badge>Unsaved</Badge> : null}
    </div>
  )
}

function CanvasSectionActionRail({
  index,
  sectionSummary,
  toolbarState,
}: {
  index: number
  sectionSummary: NonNullable<CanvasSectionChromeProps['sectionSummary']>
  toolbarState: NonNullable<CanvasSectionChromeProps['toolbarState']>
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

export function CanvasSectionChrome({
  children,
  index,
  isSelected,
  label,
  sectionBadgeLabel,
  sectionRef,
  sectionSummary,
  supportsInsertionAbove,
  toolbarState,
  onClickCapture,
}: CanvasSectionChromeProps) {
  const hasToolbarState = Boolean(toolbarState)
  const hasSectionSummary = Boolean(sectionSummary && toolbarState)

  return (
    <div
      ref={sectionRef}
      className={cn(
        'group relative rounded-[1.6rem] transition',
        isSelected ? 'ring-2 ring-primary/40 ring-offset-4 ring-offset-background' : 'hover:ring-2 hover:ring-primary/20 hover:ring-offset-4 hover:ring-offset-background',
      )}
      data-page-composer-block-index={index}
      data-page-composer-selected={isSelected ? 'true' : 'false'}
      onClickCapture={onClickCapture}
    >
      <CanvasInsertHandle
        align="top"
        hidden={!hasToolbarState || !supportsInsertionAbove}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          toolbarState?.onAddAbove(index)
        }}
      />

      <CanvasSectionSelectionChip isSelected={isSelected} label={label} sectionBadgeLabel={sectionBadgeLabel} />

      {hasSectionSummary ? (
        <CanvasSectionSummaryBadges
          sectionBadgeLabel={sectionBadgeLabel}
          sectionSummary={sectionSummary}
          toolbarState={toolbarState}
        />
      ) : null}

      {hasSectionSummary && index >= 0 ? (
        <CanvasSectionActionRail index={index} sectionSummary={sectionSummary} toolbarState={toolbarState} />
      ) : null}

      <div data-selected={isSelected ? 'true' : 'false'}>{children}</div>

      <CanvasInsertHandle
        align="bottom"
        hidden={!hasToolbarState}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          toolbarState?.onAddBelow(index)
        }}
      />
    </div>
  )
}
