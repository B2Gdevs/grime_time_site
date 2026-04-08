'use client'

import { LoaderCircleIcon, Trash2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import {
  filterUniqueMarketingRouteSummariesForComposer,
  normalizeComposerRoutePath,
  type PageComposerPageSummary,
} from '@/lib/pages/pageComposer'

export function PageComposerDrawerMarketingRoutesList({
  bulkDeleteBusy,
  bulkPages,
  currentPath,
  deletingPageId,
  loading,
  marketingPages,
  onDeletePage,
  onNavigateToPage,
}: {
  bulkDeleteBusy: boolean
  bulkPages: {
    onClear: () => void
    onRequestDelete: () => void
    onSelectAll: () => void
    onToggle: (pageId: number) => void
    selectedIds: number[]
  }
  currentPath: string
  deletingPageId: null | number
  loading: boolean
  marketingPages: PageComposerPageSummary[]
  onDeletePage: (args: { isPublished: boolean; pageId: number; pagePath: string; title: string }) => void | Promise<void>
  onNavigateToPage: (pagePath: string) => void
}) {
  const [showAllRoutes, setShowAllRoutes] = useState(false)

  const visiblePages = useMemo(() => {
    if (showAllRoutes) {
      return marketingPages
    }
    return filterUniqueMarketingRouteSummariesForComposer(marketingPages, currentPath)
  }, [currentPath, marketingPages, showAllRoutes])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading routes…</p>
  }

  if (marketingPages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No marketing pages in the CMS yet. Save a draft or publish from the visual composer to create one.
      </p>
    )
  }

  const current = normalizeComposerRoutePath(currentPath)
  const persistedIds = visiblePages
    .map((p) => p.id)
    .filter((id): id is number => typeof id === 'number')
  const selectionLocked = deletingPageId !== null || bulkDeleteBusy
  const selectedBulkCount = bulkPages.selectedIds.length

  return (
    <div className="grid gap-3">
      <div
        className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2"
        data-page-composer-no-drag="true"
      >
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn('text-xs font-medium text-foreground', adminPanelChrome.fieldLabel)}>Show all</span>
          <button
            aria-checked={showAllRoutes}
            className={cn(
              'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              showAllRoutes ? 'bg-primary' : 'bg-input',
            )}
            onClick={() => {
              setShowAllRoutes((prev) => {
                const next = !prev
                if (!next) {
                  bulkPages.onClear()
                }
                return next
              })
            }}
            role="switch"
            type="button"
          >
            <span
              aria-hidden
              className={cn(
                'pointer-events-none block h-6 w-6 translate-x-0 rounded-full bg-background shadow-md ring-0 transition-transform',
                showAllRoutes && 'translate-x-5',
              )}
            />
          </button>
        </div>
      </div>
      {visiblePages.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No published routes yet. Turn on <span className="font-medium text-foreground">Show all</span> to list draft
          pages and experiments.
        </p>
      ) : null}
      {persistedIds.length > 0 ? (
        <div
          className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2"
          data-page-composer-no-drag="true"
        >
          <Button
            className="h-8 rounded-lg text-xs"
            disabled={persistedIds.length === 0 || selectionLocked}
            onClick={() => bulkPages.onSelectAll()}
            size="sm"
            type="button"
            variant="outline"
          >
            Select all
          </Button>
          <Button
            className="h-8 rounded-lg text-xs"
            disabled={selectedBulkCount === 0 || selectionLocked}
            onClick={() => bulkPages.onClear()}
            size="sm"
            type="button"
            variant="outline"
          >
            Clear
          </Button>
          <Button
            className="h-8 rounded-lg text-xs"
            disabled={selectedBulkCount === 0 || selectionLocked}
            onClick={() => bulkPages.onRequestDelete()}
            size="sm"
            type="button"
            variant="destructive"
          >
            <Trash2Icon aria-hidden className="mr-1 h-3.5 w-3.5" />
            Delete selected{selectedBulkCount > 0 ? ` (${selectedBulkCount})` : ''}
          </Button>
        </div>
      ) : null}
      <ul className="grid gap-2">
      {visiblePages.map((p, index) => {
        const active = normalizeComposerRoutePath(p.pagePath) === current
        const status =
          p._status === 'published' ? 'published' : p.id != null ? 'draft' : 'unsaved'
        const pageId = typeof p.id === 'number' ? p.id : null
        const isPublished = p._status === 'published'
        const busy = pageId !== null && deletingPageId === pageId

        return (
          <li key={p.id ?? p.slug} className="group flex items-stretch gap-2">
            <div className="flex w-14 shrink-0 items-start gap-1.5 pt-2">
              {pageId !== null ? (
                <label className={cn('inline-flex', selectionLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}>
                  <span className="sr-only">Select page for bulk delete</span>
                  <input
                    checked={bulkPages.selectedIds.includes(pageId)}
                    className="mt-0.5 h-4 w-4 rounded border border-input accent-primary"
                    disabled={selectionLocked}
                    onChange={() => bulkPages.onToggle(pageId)}
                    type="checkbox"
                  />
                </label>
              ) : (
                <span className="inline-block w-4" />
              )}
              <span
                aria-hidden
                className="flex min-w-0 flex-1 items-start justify-end pt-0.5 text-xs font-medium tabular-nums text-muted-foreground"
              >
                {index + 1}.
              </span>
            </div>
            <Button
              className={cn(
                'h-auto min-h-10 min-w-0 flex-1 justify-between gap-2 px-3 py-2 text-left font-normal',
                active && 'border-primary/40 bg-muted/50',
              )}
              onClick={() => onNavigateToPage(p.pagePath)}
              type="button"
              variant={active ? 'secondary' : 'outline'}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{p.title || p.slug}</span>
                <span className="block truncate text-xs text-muted-foreground">{p.pagePath}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant={p.visibility === 'private' ? 'secondary' : 'outline'} className="text-[0.65rem]">
                  {p.visibility === 'private' ? 'Staff' : 'Public'}
                </Badge>
                <Badge
                  variant={status === 'published' ? 'default' : 'outline'}
                  className="text-[0.65rem] capitalize"
                >
                  {status === 'published' ? 'Published' : 'Draft'}
                </Badge>
              </span>
            </Button>
            {pageId !== null ? (
              <Button
                aria-label={`Delete ${p.title || p.slug}`}
                className="h-auto min-h-10 w-9 shrink-0 text-destructive opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-40"
                disabled={busy || selectionLocked}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  void onDeletePage({
                    isPublished,
                    pageId,
                    pagePath: p.pagePath,
                    title: p.title ?? '',
                  })
                }}
                type="button"
                variant="ghost"
              >
                {busy ? (
                  <LoaderCircleIcon aria-hidden className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2Icon aria-hidden className="h-4 w-4" />
                )}
              </Button>
            ) : null}
          </li>
        )
      })}
      </ul>
    </div>
  )
}
