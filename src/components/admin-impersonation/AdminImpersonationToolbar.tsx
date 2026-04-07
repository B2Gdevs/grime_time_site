'use client'

import type { PointerEvent as ReactPointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { ChevronUpIcon, GripIcon } from 'lucide-react'

import type { AdminPreviewUser } from '@/components/admin-impersonation/types'
import { SiteOperatorToolsPanel } from '@/components/admin-impersonation/SiteOperatorToolsPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type Corner = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'

const STORAGE_KEY = 'admin-preview-toolbar-corner-v2'
const STORAGE_MINIMIZED_KEY = 'admin-preview-toolbar-minimized'

function readStoredCorner(fallback: Corner): Corner {
  if (typeof window === 'undefined') {
    return fallback
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'top-left' ||
    stored === 'top-right' ||
    stored === 'bottom-left' ||
    stored === 'bottom-right'
    ? stored
    : fallback
}

function readStoredMinimized(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(STORAGE_MINIMIZED_KEY) === '1'
}

function pickCorner(point: { x: number; y: number }): Corner {
  if (typeof window === 'undefined') {
    return 'top-right'
  }

  const corners: Record<Corner, { x: number; y: number }> = {
    'bottom-left': { x: 0, y: window.innerHeight },
    'bottom-right': { x: window.innerWidth, y: window.innerHeight },
    'top-left': { x: 0, y: 0 },
    'top-right': { x: window.innerWidth, y: 0 },
  }

  let nearest: Corner = 'top-right'
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const [corner, cornerPoint] of Object.entries(corners) as Array<[Corner, { x: number; y: number }]>) {
    const distance = Math.hypot(point.x - cornerPoint.x, point.y - cornerPoint.y)

    if (distance < nearestDistance) {
      nearest = corner
      nearestDistance = distance
    }
  }

  return nearest
}

function pickCornerFromRect(rect: DOMRect): Corner {
  return pickCorner({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  })
}

function readCssPixelVariable(name: string, fallback: number): number {
  if (typeof window === 'undefined') {
    return fallback
  }

  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const parsed = Number.parseFloat(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

function clampPosition(value: number, max: number): number {
  return Math.min(Math.max(value, 0), Math.max(max, 0))
}

function resolveCornerPosition(args: {
  corner: Corner
  height: number
  width: number
}): { x: number; y: number } {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 }
  }

  const floatingOffset = readCssPixelVariable('--portal-floating-offset', 16)
  const stickyTop = readCssPixelVariable('--portal-sticky-top', 80)
  const maxX = window.innerWidth - args.width
  const maxY = window.innerHeight - args.height

  const left = clampPosition(floatingOffset, maxX)
  const right = clampPosition(window.innerWidth - args.width - floatingOffset, maxX)
  const top = clampPosition(stickyTop, maxY)
  const bottom = clampPosition(window.innerHeight - args.height - floatingOffset, maxY)

  switch (args.corner) {
    case 'top-left':
      return { x: left, y: top }
    case 'top-right':
      return { x: right, y: top }
    case 'bottom-left':
      return { x: left, y: bottom }
    case 'bottom-right':
    default:
      return { x: right, y: bottom }
  }
}

function shortLabel(user: AdminPreviewUser): string {
  return user.name?.trim() || user.email
}

function DragHandle({ onPointerDown }: { onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          aria-label="Move preview toolbar"
          className="flex size-8 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:cursor-grabbing"
          onPointerDown={onPointerDown}
          role="button"
          tabIndex={0}
          whileTap={{ scale: 0.96 }}
        >
          <GripIcon className="h-4 w-4" />
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>Drag to another corner</TooltipContent>
    </Tooltip>
  )
}

export function AdminImpersonationToolbar({
  effectiveUser,
  impersonatedUser,
  localPageMediaEnabled = false,
  realUser,
}: {
  effectiveUser: AdminPreviewUser
  impersonatedUser: AdminPreviewUser | null
  localPageMediaEnabled?: boolean
  realUser: AdminPreviewUser
}) {
  const dragControls = useDragControls()
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const [corner, setCorner] = useState<Corner>(() => readStoredCorner('top-right'))
  const [minimized, setMinimized] = useState(() => readStoredMinimized())
  const [toolbarSize, setToolbarSize] = useState({ height: 0, width: 0 })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, corner)
  }, [corner])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_MINIMIZED_KEY, minimized ? '1' : '0')
  }, [minimized])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    function syncSize() {
      const rect = toolbarRef.current?.getBoundingClientRect()
      if (!rect) {
        return
      }

      setToolbarSize((current) => {
        const next = { height: Math.round(rect.height), width: Math.round(rect.width) }
        return current.height === next.height && current.width === next.width ? current : next
      })
    }

    syncSize()

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            syncSize()
          })
        : null

    if (toolbarRef.current && observer) {
      observer.observe(toolbarRef.current)
    }

    window.addEventListener('resize', syncSize)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', syncSize)
    }
  }, [minimized])

  const targetPosition = resolveCornerPosition({
    corner,
    height: toolbarSize.height,
    width: toolbarSize.width,
  })

  return (
    <TooltipProvider>
      <motion.div
        ref={toolbarRef}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        onDragEnd={() => {
          const rect = toolbarRef.current?.getBoundingClientRect()
          if (!rect) return

          setCorner(pickCornerFromRect(rect))
        }}
        animate={{ opacity: 1, scale: 1, x: targetPosition.x, y: targetPosition.y }}
        className={`fixed left-0 top-0 z-[70] ${minimized ? 'w-auto max-w-[calc(100vw-2rem)]' : 'w-[min(24rem,calc(100vw-2rem))]'}`}
        initial={{ opacity: 0, scale: 0.92 }}
        transition={{
          opacity: { duration: 0.18, ease: 'easeOut' },
          scale: { duration: 0.18, ease: 'easeOut' },
          x: { type: 'spring', stiffness: 380, damping: 32 },
          y: { type: 'spring', stiffness: 380, damping: 32 },
        }}
      >
        <div
          className={`${minimized ? 'rounded-full px-3 py-2' : 'rounded-2xl p-3'} border border-border/70 bg-background/95 shadow-2xl backdrop-blur`}
        >
          {minimized ? (
            <div className="flex items-center gap-2">
              <DragHandle onPointerDown={(event) => dragControls.start(event)} />
              <button
                className="flex items-center gap-2 rounded-full px-1 text-left"
                onClick={() => setMinimized(false)}
                type="button"
              >
                <Badge variant="outline">Operator tools</Badge>
                {impersonatedUser ? <Badge>Impersonating</Badge> : null}
                <span className="max-w-32 truncate text-xs font-medium">{shortLabel(effectiveUser)}</span>
              </button>
              <Button aria-label="Open preview toolbar" onClick={() => setMinimized(false)} size="icon" type="button" variant="ghost">
                <ChevronUpIcon className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Grime Time admin</Badge>
                    {impersonatedUser ? <Badge>Impersonating</Badge> : null}
                  </div>
                  <div className="text-sm font-semibold">{shortLabel(effectiveUser)}</div>
                  <div className="text-xs text-muted-foreground">Signed in through Clerk as {realUser.email}</div>
                </div>
                <div className="flex items-center gap-1">
                  <DragHandle onPointerDown={(event) => dragControls.start(event)} />
                  <Button onClick={() => setMinimized(true)} size="sm" type="button" variant="outline">
                    Collapse
                  </Button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                <motion.div
                  key="panel"
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                  initial={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                >
                  <div className="mt-4">
                    <SiteOperatorToolsPanel
                      effectiveUser={effectiveUser}
                      impersonatedUser={impersonatedUser}
                      localPageMediaEnabled={localPageMediaEnabled}
                      realUser={realUser}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  )
}
