'use client'

import type { MouseEvent, ReactNode, RefObject } from 'react'

import { CanvasSectionActionRail } from './CanvasSectionActionRail'
import { CanvasSectionSelectionChip } from './CanvasSectionSelectionChip'
import type { PageComposerToolbarState } from '@/components/page-composer/PageComposerContext'
import { cn } from '@/utilities/ui'
import type { PageComposerSectionSummary } from '@/lib/pages/pageComposer'

type CanvasSectionChromeProps = {
  children: ReactNode
  index: number
  isSelected: boolean
  label: string
  sectionIdentity?: string
  sectionRef: RefObject<HTMLDivElement | null>
  sectionSummary: null | PageComposerSectionSummary
  supportsInsertionAbove: boolean
  toolbarState: null | PageComposerToolbarState
  onClickCapture: (event: MouseEvent<HTMLDivElement>) => void
}

export function CanvasSectionChrome({
  children,
  index,
  isSelected,
  label,
  sectionIdentity,
  sectionRef,
  sectionSummary,
  supportsInsertionAbove,
  toolbarState,
  onClickCapture,
}: CanvasSectionChromeProps) {
  const hasToolbarState = Boolean(toolbarState)
  const sectionToolbarState = sectionSummary && toolbarState ? toolbarState : null
  const visibleSectionSummary = sectionSummary && toolbarState ? sectionSummary : null
  const sectionOrder = sectionSummary?.index

  return (
    <div
      ref={sectionRef}
      className={cn(
        'group relative rounded-[1.6rem] transition',
        isSelected ? 'ring-2 ring-primary/40 ring-offset-4 ring-offset-background' : 'hover:ring-2 hover:ring-primary/20 hover:ring-offset-4 hover:ring-offset-background',
      )}
      data-page-composer-block-index={index}
      data-page-composer-block-identity={sectionIdentity}
      data-page-composer-block-order={sectionOrder ?? index}
      data-page-composer-selected={isSelected ? 'true' : 'false'}
      onClickCapture={onClickCapture}
      style={typeof sectionOrder === 'number' ? { order: sectionOrder } : undefined}
    >
      {visibleSectionSummary && sectionToolbarState ? (
        <CanvasSectionActionRail
          index={index}
          sectionSummary={visibleSectionSummary}
          supportsInsertionAbove={hasToolbarState && supportsInsertionAbove}
          toolbarState={sectionToolbarState}
        />
      ) : null}

      <div data-selected={isSelected ? 'true' : 'false'}>{children}</div>
    </div>
  )
}
