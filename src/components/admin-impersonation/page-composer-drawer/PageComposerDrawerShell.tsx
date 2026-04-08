'use client'

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion, useDragControls, useMotionValue } from 'motion/react'

import {
  PageComposerDrawerChrome,
  type PageComposerDrawerChromeProps,
} from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerChrome'

type PageComposerDrawerShellProps = Omit<PageComposerDrawerChromeProps, 'onStartDrag'> & {
  embedded?: boolean
  enabled: boolean
  isOpen: boolean
  /** When true, the floating panel is hidden and the edge launcher is shown instead. */
  isPanelMinimized: boolean
}

export function PageComposerDrawerShell({
  activeTab,
  blockLibrary,
  embedded = false,
  enabled,
  isOpen,
  isPanelMinimized,
  media,
  onDismiss,
  onMinimizePanel,
  page,
  history,
  sections,
  tabs,
}: PageComposerDrawerShellProps) {
  const dragControls = useDragControls()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const clampToViewport = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    const node = panelRef.current

    if (!node) {
      return
    }

    const margin = 8
    const topMargin = 72
    const rect = node.getBoundingClientRect()
    let nextX = x.get()
    let nextY = y.get()

    if (rect.left < margin) {
      nextX += margin - rect.left
    }

    if (rect.right > window.innerWidth - margin) {
      nextX += window.innerWidth - margin - rect.right
    }

    if (rect.top < topMargin) {
      nextY += topMargin - rect.top
    }

    if (rect.bottom > window.innerHeight - margin) {
      nextY += window.innerHeight - margin - rect.bottom
    }

    x.set(nextX)
    y.set(nextY)
  }, [x, y])

  useEffect(() => {
    if (!enabled || !isOpen || isPanelMinimized) {
      return
    }

    clampToViewport()

    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('resize', clampToViewport)

    return () => {
      window.removeEventListener('resize', clampToViewport)
    }
  }, [clampToViewport, enabled, isOpen, isPanelMinimized])

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    dragControls.start(event)
  }

  const panel = (
    <PageComposerDrawerChrome
      activeTab={activeTab}
      blockLibrary={blockLibrary}
      embedded={embedded}
      media={media}
      onDismiss={onDismiss}
      onMinimizePanel={embedded ? undefined : onMinimizePanel}
      onStartDrag={startDrag}
      page={page}
      history={history}
      sections={sections}
      tabs={tabs}
    />
  )

  if (!enabled || !isOpen) {
    return null
  }

  if (embedded) {
    if (isPanelMinimized) {
      return null
    }
    return panel
  }

  return (
    <AnimatePresence>
      {!isPanelMinimized ? (
        <motion.div
          key="page-composer-floating-panel"
          animate={{ opacity: 1, scale: 1 }}
          aria-label="Page composer"
          aria-modal="false"
          className="fixed right-4 top-[5.5rem] z-[96] w-[min(36rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]"
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
          initial={{ opacity: 0, scale: 0.98 }}
          onDragEnd={clampToViewport}
          ref={panelRef}
          role="dialog"
          style={{ x, y }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="h-[min(44rem,calc(100vh-6rem))]">{panel}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
