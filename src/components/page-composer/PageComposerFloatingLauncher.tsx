'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useMotionValue } from 'motion/react'
import { FilePenLineIcon, Settings2Icon } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { usePageComposerOptional } from '@/components/page-composer/PageComposerContext'
import { composerPagePathForPathname } from '@/lib/pages/pageComposerLiveRoute'
import { cn } from '@/utilities/ui'

const LAUNCHER_POSITION_KEY = 'page-composer-floating-launcher-position'
/** Ignore the next click on the launcher if the user just finished dragging (avoids opening accidentally). */
const DRAG_CLICK_SUPPRESS_PX = 8

/**
 * Draggable floating entry when the composer is closed, and a compact settings chip when the panel is minimized
 * (same interaction model as Site Copilot’s chat launcher on the portfolio app).
 */
export function PageComposerFloatingLauncher() {
  const composer = usePageComposerOptional()
  const pathname = usePathname()
  const launcherConstraintsRef = useRef<HTMLDivElement>(null)
  const launcherDragMovedRef = useRef(false)
  const launcherX = useMotionValue(0)
  const launcherY = useMotionValue(0)
  const composerPagePath = composerPagePathForPathname(pathname)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      const raw = localStorage.getItem(LAUNCHER_POSITION_KEY)
      if (!raw) {
        return
      }
      const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown }
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        launcherX.set(parsed.x)
        launcherY.set(parsed.y)
      }
    } catch {
      /* ignore */
    }
  }, [launcherX, launcherY])

  if (!composer) {
    return null
  }

  if (composer.isOpen && !composer.isPanelMinimized) {
    return null
  }

  const isMinimized = composer.isOpen && composer.isPanelMinimized

  const handlePrimaryClick = () => {
    if (launcherDragMovedRef.current) {
      launcherDragMovedRef.current = false
      return
    }
    composer.setActivePagePath(composerPagePath)
    if (isMinimized) {
      composer.setPanelMinimized(false)
    } else {
      composer.setActiveTab('content')
      composer.open()
    }
  }

  return (
    <div ref={launcherConstraintsRef} className="pointer-events-none fixed inset-0 z-[100]">
      <AnimatePresence mode="wait">
        <motion.div
          key={isMinimized ? 'minimized' : 'closed'}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-auto absolute right-6 bottom-6 touch-none"
          drag
          dragConstraints={launcherConstraintsRef}
          dragElastic={0}
          dragMomentum={false}
          exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
          initial={{ opacity: 0, scale: 0.9 }}
          style={{ x: launcherX, y: launcherY }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onDrag={(_, info) => {
            if (
              Math.abs(info.offset.x) > DRAG_CLICK_SUPPRESS_PX ||
              Math.abs(info.offset.y) > DRAG_CLICK_SUPPRESS_PX
            ) {
              launcherDragMovedRef.current = true
            }
          }}
          onDragEnd={() => {
            try {
              localStorage.setItem(
                LAUNCHER_POSITION_KEY,
                JSON.stringify({ x: launcherX.get(), y: launcherY.get() }),
              )
            } catch {
              /* ignore */
            }
          }}
          onDragStart={() => {
            launcherDragMovedRef.current = false
          }}
        >
          {isMinimized ? (
            <button
              aria-label="Expand visual composer"
              className={cn(
                'inline-flex h-12 w-12 items-center justify-center rounded-full border border-border/70 bg-background/95 text-foreground shadow-[0_18px_44px_rgba(0,0,0,0.12)] backdrop-blur',
                'cursor-grab transition hover:bg-muted/90 active:cursor-grabbing',
              )}
              type="button"
              onClick={handlePrimaryClick}
            >
              <Settings2Icon aria-hidden className="h-5 w-5" />
            </button>
          ) : (
            <button
              className={cn(
                'inline-flex cursor-grab items-center gap-2 rounded-full border border-border/70 bg-background/95 px-4 py-3 text-sm font-medium text-foreground shadow-[0_18px_44px_rgba(0,0,0,0.12)] backdrop-blur',
                'transition hover:bg-muted/90 active:cursor-grabbing',
              )}
              type="button"
              onClick={handlePrimaryClick}
            >
              <FilePenLineIcon aria-hidden className="h-4 w-4" />
              Page composer
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
