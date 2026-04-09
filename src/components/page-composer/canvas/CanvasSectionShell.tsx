'use client'

import { usePathname } from 'next/navigation'
import { useRef, type ReactNode } from 'react'

import { usePageComposerOptional, type PageComposerToolbarState } from '@/components/page-composer/PageComposerContext'
import { resolveComposerPagePathForPathname } from '@/lib/pages/pageComposerLiveRoute'

import { CanvasSectionChrome } from './CanvasSectionChrome'

export function PageComposerCanvasSectionShell({
  children,
  index,
  label,
  sectionIdentity,
  supportsInsertionAbove = true,
  toolbarState,
}: {
  children: ReactNode
  index: number
  label: string
  sectionIdentity?: string
  supportsInsertionAbove?: boolean
  toolbarState: null | PageComposerToolbarState
}) {
  const composer = usePageComposerOptional()
  const pathname = usePathname()
  const composerPagePath = resolveComposerPagePathForPathname(pathname)
  const sectionRef = useRef<HTMLDivElement | null>(null)

  const isActive = Boolean(
    composerPagePath && composer?.isOpen && composer.activePagePath && composer.activePagePath === composerPagePath,
  )
  const sectionSummary = toolbarState
    ? (
        sectionIdentity
          ? toolbarState.sectionSummaries.find((summary) => summary.identity === sectionIdentity)
          : undefined
      ) ?? toolbarState.sectionSummaries.find((summary) => summary.index === index) ?? null
    : null
  const resolvedIndex = sectionSummary?.index ?? index
  const isSelected = Boolean(isActive && composer?.selectedIndex === resolvedIndex)

  if (!composer || !isActive) {
    return <>{children}</>
  }

  return (
    <CanvasSectionChrome
      actionIndex={resolvedIndex}
      index={index}
      isSelected={isSelected}
      label={label}
      sectionIdentity={sectionIdentity}
      sectionRef={sectionRef}
      sectionSummary={sectionSummary}
      supportsInsertionAbove={supportsInsertionAbove}
      toolbarState={toolbarState}
      onClickCapture={(event) => {
        const target = event.target as HTMLElement | null
        const interactiveTarget = target?.closest('[data-page-composer-interactive="true"]')
        const actionRailTarget = target?.closest('[data-page-composer-action-rail="true"]')

        if (actionRailTarget) {
          return
        }

        if (interactiveTarget) {
          composer.setSelectedIndex(resolvedIndex)
          return
        }

        event.preventDefault()
        event.stopPropagation()
        composer.setSelectedIndex(resolvedIndex)
      }}
    >
      {children}
    </CanvasSectionChrome>
  )
}
