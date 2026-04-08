'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'

import { usePageComposerOptional, type PageComposerToolbarState } from '@/components/admin-impersonation/PageComposerContext'

import { CanvasSectionChrome } from './CanvasSectionChrome'

export function PageComposerCanvasSectionShell({
  children,
  index,
  label,
  supportsInsertionAbove = true,
  toolbarState,
}: {
  children: ReactNode
  index: number
  label: string
  supportsInsertionAbove?: boolean
  toolbarState: null | PageComposerToolbarState
}) {
  const composer = usePageComposerOptional()
  const pathname = usePathname()
  const sectionRef = useRef<HTMLDivElement | null>(null)

  const isActive = Boolean(
    composer?.isOpen && composer.activePagePath && composer.activePagePath === pathname,
  )
  const isSelected = Boolean(isActive && composer?.selectedIndex === index)
  const sectionSummary = toolbarState ? toolbarState.sectionSummaries.find((summary) => summary.index === index) ?? null : null

  useEffect(() => {
    if (!isSelected) {
      return
    }

    if (typeof sectionRef.current?.scrollIntoView === 'function') {
      sectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [isSelected])

  if (!composer || !isActive) {
    return <>{children}</>
  }

  return (
    <CanvasSectionChrome
      index={index}
      isSelected={isSelected}
      label={label}
      sectionRef={sectionRef}
      sectionSummary={sectionSummary}
      supportsInsertionAbove={supportsInsertionAbove}
      toolbarState={toolbarState}
      onClickCapture={(event) => {
        const target = event.target as HTMLElement | null
        const interactiveTarget = target?.closest('[data-page-composer-interactive="true"]')

        if (interactiveTarget) {
          composer.setSelectedIndex(index)
          return
        }

        event.preventDefault()
        event.stopPropagation()
        composer.setSelectedIndex(index)
      }}
    >
      {children}
    </CanvasSectionChrome>
  )
}
