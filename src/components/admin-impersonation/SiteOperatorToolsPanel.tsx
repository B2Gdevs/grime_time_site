'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowUpRightIcon,
  ArrowRightLeftIcon,
  CircleOffIcon,
  HomeIcon,
  LayoutDashboardIcon,
  SearchIcon,
  ShieldIcon,
} from 'lucide-react'

import { usePageComposerOptional } from '@/components/admin-impersonation/PageComposerContext'
import type { AdminPreviewSearchUser, AdminPreviewUser } from '@/components/admin-impersonation/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { parseResponseJson } from '@/utilities/parseResponseJson'

import { adminPanelChrome } from './adminPanelChrome'

function isSecuredAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/docs') || pathname.startsWith('/ops')
}

function shortLabel(user: AdminPreviewUser) {
  return user.name?.trim() || user.email
}

export type SiteOperatorToolsPanelProps = {
  effectiveUser?: AdminPreviewUser | null
  impersonatedUser?: AdminPreviewUser | null
  localPageMediaEnabled?: boolean
  realUser?: AdminPreviewUser | null
}

export function SiteOperatorToolsPanel({
  effectiveUser = null,
  impersonatedUser = null,
  realUser = null,
}: SiteOperatorToolsPanelProps) {
  const composer = usePageComposerOptional()
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminPreviewSearchUser[]>([])
  const [status, setStatus] = useState<null | string>(null)
  const [submitting, setSubmitting] = useState(false)

  const canImpersonate = Boolean(effectiveUser && realUser)
  const composerPagePath = isSecuredAdminPath(pathname) ? '/' : pathname
  const composerVisibleOnPage = Boolean(
    composer?.isOpen && composer.activePagePath === composerPagePath,
  )

  function toggleComposer(enabled: boolean) {
    if (!composer) {
      return
    }

    if (!enabled) {
      composer.close()
      return
    }

    composer.setActivePagePath(composerPagePath)
    composer.setActiveTab('content')
    composer.open()
  }

  useEffect(() => {
    if (!canImpersonate) {
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setStatus(null)

      try {
        const response = await fetch(`/api/internal/impersonation/users?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        })
        const payload = await parseResponseJson<{ error?: string; users?: AdminPreviewSearchUser[] }>(response)

        if (!response.ok) {
          setStatus(payload?.error || 'Unable to load users.')
          setResults([])
          return
        }

        setResults(payload?.users ?? [])
      } catch {
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
  }, [canImpersonate, query])

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
      const payload = await parseResponseJson<{ error?: string }>(response)

      if (!response.ok) {
        setStatus(payload?.error || 'Unable to start preview.')
        return
      }

      const nextPath = isSecuredAdminPath(pathname) ? '/' : pathname
      router.push(nextPath)
      router.refresh()
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
      const payload = await parseResponseJson<{ error?: string }>(response)

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
    <div className="grid gap-5">
      <div className={adminPanelChrome.panelGrid}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Operator tools</Badge>
          {effectiveUser ? <Badge variant="secondary">{shortLabel(effectiveUser)}</Badge> : null}
          {impersonatedUser ? <Badge>Impersonating</Badge> : null}
        </div>

        {canImpersonate ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <Button asChild size="sm" type="button" variant="outline">
              <Link className="justify-start" href="/">
                <HomeIcon className="h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button asChild size="sm" type="button" variant="outline">
              <Link className="justify-start" href="/ops">
                <ShieldIcon className="h-4 w-4" />
                Ops
              </Link>
            </Button>
            <Button asChild size="sm" type="button" variant="outline">
              <Link className="justify-start" href="/dashboard">
                <LayoutDashboardIcon className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        ) : null}

        {composer ? (
          <div className="rounded-xl border bg-background/70 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={adminPanelChrome.fieldLabelTight}>
                  Visual composer
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {composerVisibleOnPage
                    ? 'Live page editing is enabled here.'
                    : 'Turn this on to edit blocks, text, and media on the live page.'}
                </div>
              </div>

              <button
                aria-checked={composerVisibleOnPage}
                aria-label={`${composerVisibleOnPage ? 'Disable' : 'Enable'} visual composer`}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
                  composerVisibleOnPage
                    ? 'border-primary bg-primary'
                    : 'border-border/70 bg-muted/60'
                }`}
                onClick={() => toggleComposer(!composerVisibleOnPage)}
                role="switch"
                type="button"
              >
                <span
                  className={`inline-flex h-5 w-5 rounded-full bg-background shadow-sm transition-transform ${
                    composerVisibleOnPage ? 'translate-x-6' : 'translate-x-1'
                  }`}
                  />
                </button>
              </div>
          </div>
        ) : null}

        {effectiveUser && realUser ? (
          <div className="rounded-xl border bg-background/70 p-3">
            <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Active view</div>
            <div className="mt-1 text-sm font-semibold">{shortLabel(effectiveUser)}</div>
            <div className="text-xs text-muted-foreground">{effectiveUser.email}</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className={adminPanelChrome.cardSm}>
                <div className={adminPanelChrome.fieldLabelTight}>
                  Signed in as
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">{shortLabel(realUser)}</div>
                <div className="text-xs text-muted-foreground">{realUser.email}</div>
              </div>
              <div className={adminPanelChrome.cardSm}>
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Role
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {impersonatedUser ? 'Admin impersonating customer' : 'Admin direct view'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {impersonatedUser ? `Impersonating ${shortLabel(impersonatedUser)}` : 'Viewing your own admin session'}
                </div>
              </div>
            </div>
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
            ) : null}
          </div>
        ) : (
          <div className={adminPanelChrome.panelDashedMuted}>
            Chat stays primary. Use this tools view when you need the visual composer while keeping the live page visible.
          </div>
        )}
      </div>

      {canImpersonate ? (
        <div className={adminPanelChrome.panelGrid}>
          <div className="grid gap-2">
            <label className={adminPanelChrome.fieldLabelWide}>
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
            {!impersonatedUser ? (
              <p className="text-xs text-muted-foreground">
                Search any non-staff customer to safely preview their portal and billing flow.
              </p>
            ) : null}
          </div>

          {status ? <div className="text-xs text-destructive">{status}</div> : null}

          <div
            className="max-h-72 space-y-2 overflow-x-hidden overflow-y-auto pr-2 [scrollbar-gutter:stable]"
            data-portal-scroll=""
          >
            {loading ? (
              <div className="text-xs text-muted-foreground">Loading users...</div>
            ) : results.length === 0 ? (
              <div className={adminPanelChrome.panelDashedEmptyXs}>
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
                    <span>Impersonate</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {impersonatedUser ? (
            <Button asChild size="sm" type="button" variant="ghost">
              <Link href="/dashboard">
                <ArrowUpRightIcon className="h-4 w-4" />
                Open customer dashboard
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
