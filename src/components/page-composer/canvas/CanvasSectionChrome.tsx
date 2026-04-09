'use client'

import type { MouseEvent, ReactNode, RefObject } from 'react'
import { motion } from 'motion/react'

import { CanvasSectionActionRail } from './CanvasSectionActionRail'
import type { PageComposerToolbarState } from '@/components/page-composer/PageComposerContext'
import { cn } from '@/utilities/ui'
import type { PageComposerSectionSummary } from '@/lib/pages/pageComposer'

type CanvasSectionChromeProps = {
  actionIndex: number
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
  actionIndex,
  children,
  index,
  isSelected,
  label: _label,
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
  const sectionViewTransitionName = sectionIdentity
    ? `page-composer-section-${sectionIdentity.replace(/[^a-z0-9_-]/gi, '-')}`
    : undefined

  return (
    <motion.div
      layout="position"
      ref={sectionRef}
      className={cn(
        'group relative rounded-[1.6rem] transition will-change-transform',
        isSelected ? 'ring-2 ring-primary/40 ring-offset-4 ring-offset-background' : 'hover:ring-2 hover:ring-primary/20 hover:ring-offset-4 hover:ring-offset-background',
      )}
      data-page-composer-block-index={index}
      data-page-composer-block-identity={sectionIdentity}
      data-page-composer-block-order={sectionOrder ?? index}
      data-page-composer-selected={isSelected ? 'true' : 'false'}
      onClickCapture={onClickCapture}
      style={{
        ...(typeof sectionOrder === 'number' ? { order: sectionOrder } : {}),
        ...(sectionViewTransitionName ? { viewTransitionName: sectionViewTransitionName } : {}),
      }}
      transition={{
        layout: {
          damping: 30,
          mass: 0.7,
          stiffness: 320,
          type: 'spring',
        },
      }}
    >
      {visibleSectionSummary && sectionToolbarState ? (
        <CanvasSectionActionRail
          index={actionIndex}
          sectionSummary={visibleSectionSummary}
          supportsInsertionAbove={hasToolbarState && supportsInsertionAbove}
          toolbarState={sectionToolbarState}
        />
      ) : null}

      <div data-selected={isSelected ? 'true' : 'false'}>{children}</div>
    </motion.div>
  )
}
