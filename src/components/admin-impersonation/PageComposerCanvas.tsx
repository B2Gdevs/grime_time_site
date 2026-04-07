'use client'

import { useEffect, useState } from 'react'

import {
  PAGE_COMPOSER_TOOLBAR_EVENT,
  type PageComposerToolbarState,
} from '@/components/admin-impersonation/PageComposerContext'

import { PageComposerCanvasSectionShell } from './page-composer-canvas/CanvasSectionShell'
import { PageComposerCanvasViewportShell } from './page-composer-canvas/CanvasViewportShell'

export function usePageComposerCanvasToolbarState() {
  const [toolbarState, setToolbarState] = useState<null | PageComposerToolbarState>(null)

  useEffect(() => {
    function handleToolbarEvent(event: Event) {
      const customEvent = event as CustomEvent<null | PageComposerToolbarState>
      setToolbarState(customEvent.detail ?? null)
    }

    window.addEventListener(PAGE_COMPOSER_TOOLBAR_EVENT, handleToolbarEvent as EventListener)

    return () => {
      window.removeEventListener(PAGE_COMPOSER_TOOLBAR_EVENT, handleToolbarEvent as EventListener)
    }
  }, [])

  return toolbarState
}

export function PageComposerCanvasViewport({ children }: { children: React.ReactNode }) {
  const toolbarState = usePageComposerCanvasToolbarState()

  return <PageComposerCanvasViewportShell toolbarState={toolbarState}>{children}</PageComposerCanvasViewportShell>
}

export function PageComposerCanvasSection({
  children,
  index,
  label,
  supportsInsertionAbove = true,
}: {
  children: React.ReactNode
  index: number
  label: string
  supportsInsertionAbove?: boolean
}) {
  const toolbarState = usePageComposerCanvasToolbarState()

  return (
    <PageComposerCanvasSectionShell
      index={index}
      label={label}
      supportsInsertionAbove={supportsInsertionAbove}
      toolbarState={toolbarState}
    >
      {children}
    </PageComposerCanvasSectionShell>
  )
}
