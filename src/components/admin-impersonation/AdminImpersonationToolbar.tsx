'use client'

import type { PointerEvent as ReactPointerEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import {
  ArrowDownLeftIcon,
  ArrowDownRightIcon,
  ArrowRightLeftIcon,
  ArrowUpLeftIcon,
  ArrowUpRightIcon,
  Building2Icon,
  ChevronUpIcon,
  CircleOffIcon,
  ExternalLinkIcon,
  EyeIcon,
  GripIcon,
  HomeIcon,
  SearchIcon,
  UserRoundIcon,
} from 'lucide-react'

import { DemoModeToggle } from '@/components/demo/DemoModeToggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { AdminPreviewSearchUser, AdminPreviewUser } from './types'

type Corner = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'

const STORAGE_KEY = 'admin-preview-toolbar-corner'
const STORAGE_MINIMIZED_KEY = 'admin-preview-toolbar-minimized'

function readStoredCorner(): Corner {
  if (typeof window === 'undefined') {
    return 'top-right'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'top-left' ||
    stored === 'top-right' ||
    stored === 'bottom-left' ||
    stored === 'bottom-right'
    ? stored
    : 'top-right'
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

function isSecuredAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/docs') || pathname.startsWith('/ops')
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

const CORNER_ICONS: Record<Corner, typeof ArrowUpLeftIcon> = {
  'bottom-left': ArrowDownLeftIcon,
  'bottom-right': ArrowDownRightIcon,
  'top-left': ArrowUpLeftIcon,
  'top-right': ArrowUpRightIcon,
}

export function AdminImpersonationToolbar({
  effectiveUser,
  impersonatedUser,
  realUser,
}: {
  effectiveUser: AdminPreviewUser
  impersonatedUser: AdminPreviewUser | null
  realUser: AdminPreviewUser
}) {
  const pathname = usePathname()
  const router = useRouter()
  const dragControls = useDragControls()
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const [corner, setCorner] = useState<Corner>('top-right')
  const [minimized, setMinimized] = useState(false)
  const [toolbarSize, setToolbarSize] = useState({ height: 0, width: 0 })
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminPreviewSearchUser[]>([])
  const [status, setStatus] = useState<null | string>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setCorner(readStoredCorner())
    setMinimized(readStoredMinimized())
  }, [])

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

  useEffect(() => {
    if (minimized) {
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setStatus(null)

      try {
        const response = await fetch(
          `/api/internal/impersonation/users?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        )
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; users?: AdminPreviewSearchUser[] }
          | null

        if (!response.ok) {
          setStatus(payload?.error || 'Unable to load users.')
          setResults([])
          return
        }

        setResults(payload?.users ?? [])
      } catch (error) {
        if (!controller.signal.aborted) {
          setStatus('Unable to load users.')
          setResults([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 180)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [minimized, query])

  const quickLinks = useMemo(
    () => [
      { href: '/', icon: HomeIcon, label: 'Home' },
      { href: '/dashboard', icon: UserRoundIcon, label: 'Dashboard' },
      { href: '/invoices', icon: Building2Icon, label: 'Invoices' },
      { href: '/account', icon: EyeIcon, label: 'Account' },
    ],
    [],
  )

  const targetPosition = useMemo(
    () =>
      resolveCornerPosition({
        corner,
        height: toolbarSize.height,
        width: toolbarSize.width,
      }),
    [corner, toolbarSize.height, toolbarSize.width],
  )

  async function startImpersonation(userId: number | string) {
    setSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch('/api/internal/impersonation/start', {
        body: JSON.stringify({ userId }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        setStatus(payload?.error || 'Unable to start preview.')
        return
      }

      const nextPath = isSecuredAdminPath(pathname) ? '/' : pathname
      router.push(nextPath)
      router.refresh()
      setMinimized(false)
    } finally {
      setSubmitting(false)
    }
  }

  async function stopImpersonation() {
    setSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch('/api/internal/impersonation/stop', {
        method: 'POST',
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        setStatus(payload?.error || 'Unable to stop preview.')
        return
      }

      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

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
        className={`fixed left-0 top-0 z-[70] ${minimized ? 'w-auto max-w-[calc(100vw-2rem)]' : 'w-[min(22rem,calc(100vw-2rem))]'}`}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1, x: targetPosition.x, y: targetPosition.y }}
        transition={{
          opacity: { duration: 0.18, ease: 'easeOut' },
          scale: { duration: 0.18, ease: 'easeOut' },
          x: { type: 'spring', stiffness: 380, damping: 32 },
          y: { type: 'spring', stiffness: 380, damping: 32 },
        }}
      >
        <div className={`${minimized ? 'rounded-full px-3 py-2' : 'rounded-2xl p-3'} border border-border/70 bg-background/95 shadow-2xl backdrop-blur`}>
          {minimized ? (
            <div className="flex items-center gap-2">
              <DragHandle onPointerDown={(event) => dragControls.start(event)} />
              <button
                className="flex items-center gap-2 rounded-full px-1 text-left"
                onClick={() => setMinimized(false)}
                type="button"
              >
                <Badge variant="outline">Admin preview</Badge>
                {impersonatedUser ? <Badge>Impersonating</Badge> : null}
                <span className="max-w-32 truncate text-xs font-medium">{shortLabel(effectiveUser)}</span>
              </button>
              <Button
                aria-label="Open preview toolbar"
                onClick={() => setMinimized(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <ChevronUpIcon className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Admin preview</Badge>
                {impersonatedUser ? <Badge>Impersonating</Badge> : null}
              </div>
              <div className="text-sm font-semibold">{shortLabel(effectiveUser)}</div>
              <div className="text-xs text-muted-foreground">Signed in as {realUser.email}</div>
            </div>
            <div className="flex items-center gap-1">
              <DragHandle onPointerDown={(event) => dragControls.start(event)} />
              <Button onClick={() => setMinimized(true)} size="sm" type="button" variant="outline">
                Collapse
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Snap to corner
            </div>
            <ToggleGroup
              type="single"
              value={corner}
              onValueChange={(value) => {
                if (value === 'top-left' || value === 'top-right' || value === 'bottom-left' || value === 'bottom-right') {
                  setCorner(value)
                }
              }}
              className="rounded-xl border bg-muted/30 p-1"
            >
              {(
                [
                  'top-left',
                  'top-right',
                  'bottom-left',
                  'bottom-right',
                ] as Corner[]
              ).map((cornerValue) => {
                const Icon = CORNER_ICONS[cornerValue]

                return (
                  <ToggleGroupItem
                    key={cornerValue}
                    value={cornerValue}
                    aria-label={`Move toolbar to ${cornerValue}`}
                    className="h-8 w-8 rounded-lg border-0 px-0 data-[state=on]:bg-background"
                    size="sm"
                    variant="outline"
                  >
                    <Icon className="h-4 w-4" />
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {quickLinks.map((link) => (
              <Button asChild key={link.href} size="sm" type="button" variant="ghost">
                <a href={link.href}>
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </a>
              </Button>
            ))}
            <DemoModeToggle />
          </div>

          <AnimatePresence initial={false}>
            {!minimized ? (
              <motion.div
                key="panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <Separator className="my-3" />
                <div className="grid gap-3">
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                      Active view
                    </div>
                    <div className="mt-1 text-sm font-semibold">{shortLabel(effectiveUser)}</div>
                    <div className="text-xs text-muted-foreground">{effectiveUser.email}</div>
                    {impersonatedUser ? (
                      <Button
                        className="mt-3 w-full"
                        disabled={submitting}
                        onClick={stopImpersonation}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <CircleOffIcon className="h-4 w-4" />
                        Switch back to admin
                      </Button>
                    ) : (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Pick any customer or company-linked user to preview their account flow.
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <label className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                      Search users
                    </label>
                    <div className="relative">
                      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by name, email, or company"
                        value={query}
                      />
                    </div>
                  </div>

                  {status ? <div className="text-xs text-destructive">{status}</div> : null}

                  <div
                    className="max-h-72 space-y-2 overflow-x-hidden overflow-y-auto pr-2 [scrollbar-gutter:stable]"
                    data-portal-scroll=""
                  >
                    {loading ? (
                      <div className="text-xs text-muted-foreground">Loading users…</div>
                    ) : results.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                        No matching customer users yet.
                      </div>
                    ) : (
                      results.map((result) => (
                        <button
                          key={String(result.id)}
                          className="flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/40"
                          disabled={submitting}
                          onClick={() => startImpersonation(result.id)}
                          type="button"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{result.name}</div>
                            <div className="truncate text-xs text-muted-foreground">{result.email}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                              {result.accountName ? <span>{result.accountName}</span> : null}
                              {result.company ? <span>{result.company}</span> : null}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 text-xs text-primary">
                            <ArrowRightLeftIcon className="h-4 w-4" />
                            <span>Preview</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {impersonatedUser ? (
                    <Button asChild size="sm" type="button" variant="ghost">
                      <a href="/dashboard">
                        <ExternalLinkIcon className="h-4 w-4" />
                        Open customer dashboard
                      </a>
                    </Button>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  )
}
