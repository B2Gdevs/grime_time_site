'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRightLeftIcon,
  Building2Icon,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { AdminPreviewSearchUser, AdminPreviewUser } from './types'

type Corner = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'

const STORAGE_KEY = 'admin-preview-toolbar-corner'

const CORNER_CLASSES: Record<Corner, string> = {
  'bottom-left': 'bottom-[var(--portal-floating-offset)] left-[var(--portal-floating-offset)]',
  'bottom-right': 'bottom-[var(--portal-floating-offset)] right-[var(--portal-floating-offset)]',
  'top-left': 'top-[var(--portal-floating-offset)] left-[var(--portal-floating-offset)]',
  'top-right': 'top-[var(--portal-floating-offset)] right-[var(--portal-floating-offset)]',
}

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

function pickCorner(point: { x: number; y: number }): Corner {
  if (typeof window === 'undefined') {
    return 'top-right'
  }

  const horizontal = point.x < window.innerWidth / 2 ? 'left' : 'right'
  const vertical = point.y < window.innerHeight / 2 ? 'top' : 'bottom'
  return `${vertical}-${horizontal}` as Corner
}

function isSecuredAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/docs') || pathname.startsWith('/ops')
}

function shortLabel(user: AdminPreviewUser): string {
  return user.name?.trim() || user.email
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
  const [corner, setCorner] = useState<Corner>('top-right')
  const [open, setOpen] = useState(Boolean(impersonatedUser))
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminPreviewSearchUser[]>([])
  const [status, setStatus] = useState<null | string>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setCorner(readStoredCorner())
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, corner)
  }, [corner])

  useEffect(() => {
    if (!open) {
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
  }, [open, query])

  const quickLinks = useMemo(
    () => [
      { href: '/', icon: HomeIcon, label: 'Home' },
      { href: '/dashboard', icon: UserRoundIcon, label: 'Dashboard' },
      { href: '/invoices', icon: Building2Icon, label: 'Invoices' },
      { href: '/account', icon: EyeIcon, label: 'Account' },
    ],
    [],
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
      setOpen(true)
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
        drag
        dragMomentum={false}
        onDragEnd={(_, info) => setCorner(pickCorner(info.point))}
        className={`fixed z-[70] w-[min(22rem,calc(100vw-2rem))] ${CORNER_CLASSES[corner]}`}
        initial={{ opacity: 0, scale: 0.92, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <div className="rounded-2xl border border-border/70 bg-background/95 p-3 shadow-2xl backdrop-blur">
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Move preview toolbar"
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <GripIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Drag to another corner</TooltipContent>
              </Tooltip>
              <Button onClick={() => setOpen((value) => !value)} size="sm" type="button" variant="outline">
                {open ? 'Hide' : 'Open'}
              </Button>
            </div>
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
            {open ? (
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

                  <div className="max-h-72 space-y-2 overflow-auto pr-1">
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
        </div>
      </motion.div>
    </TooltipProvider>
  )
}
