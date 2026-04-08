'use client'

import { HistoryIcon, InfoIcon, LoaderCircleIcon, Trash2Icon, Undo2Icon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utilities/ui'
import { formatComposerTimestamp } from '@/utilities/formatComposerTimestamp'
import type { PageComposerVersionSummary } from '@/lib/pages/pageComposer'

export function PageComposerDrawerPublishHistoryCard({
  bulkDeleteBusy = false,
  bulkVersions,
  pageVersions,
  restoringVersionId,
  savingAction,
  restorePageVersion,
}: {
  bulkDeleteBusy?: boolean
  bulkVersions?: {
    onClear: () => void
    onRequestDelete: () => void
    onSelectAll: () => void
    onToggle: (versionId: string) => void
    selectedIds: string[]
  }
  pageVersions: PageComposerVersionSummary[]
  restoringVersionId: null | string
  savingAction: null | 'publish-page' | 'save-draft'
  restorePageVersion: (version: PageComposerVersionSummary) => Promise<void>
}) {
  const bulkEnabled = bulkVersions != null
  const deletableCount = pageVersions.filter((v) => !v.latest).length
  const selectionLocked = savingAction !== null || restoringVersionId !== null || bulkDeleteBusy
  const selectedBulkCount = bulkVersions?.selectedIds.length ?? 0

  return (
    <div className={adminPanelChrome.card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className={cn('flex items-center gap-2', adminPanelChrome.fieldLabel)}>
            <HistoryIcon className="h-3.5 w-3.5" />
            Draft history
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label="About draft history"
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    data-page-composer-no-drag="true"
                    type="button"
                  >
                    <InfoIcon className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[260px] text-xs leading-snug" side="top">
                  The CMS stores version snapshots for this page when you save or publish. Restore loads a snapshot into
                  your current draft.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="mt-2 text-sm font-semibold text-foreground">Restore an earlier snapshot into the current draft</div>
        </div>
        <Badge variant="outline">
          {pageVersions.length} version{pageVersions.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {pageVersions.length ? (
        <div className="mt-4 grid gap-3">
          {bulkEnabled ? (
            <div
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2"
              data-page-composer-no-drag="true"
            >
              <Button
                className="h-8 rounded-lg text-xs"
                disabled={deletableCount === 0 || selectionLocked}
                onClick={() => bulkVersions?.onSelectAll()}
                size="sm"
                type="button"
                variant="outline"
              >
                Select all
              </Button>
              <Button
                className="h-8 rounded-lg text-xs"
                disabled={selectedBulkCount === 0 || selectionLocked}
                onClick={() => bulkVersions?.onClear()}
                size="sm"
                type="button"
                variant="outline"
              >
                Clear
              </Button>
              <Button
                className="h-8 rounded-lg text-xs"
                disabled={selectedBulkCount === 0 || selectionLocked}
                onClick={() => bulkVersions?.onRequestDelete()}
                size="sm"
                type="button"
                variant="destructive"
              >
                <Trash2Icon aria-hidden className="mr-1 h-3.5 w-3.5" />
                Delete selected{selectedBulkCount > 0 ? ` (${selectedBulkCount})` : ''}
              </Button>
            </div>
          ) : null}
          {pageVersions.map((version, index) => (
            <div className={adminPanelChrome.versionNest} key={version.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid min-w-0 flex-1 gap-2 sm:flex sm:flex-row sm:items-start sm:gap-3">
                  {bulkEnabled ? (
                    <div className="flex shrink-0 items-start gap-2 pt-0.5">
                      <label
                        className={cn(
                          'inline-flex',
                          version.latest ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                        )}
                      >
                        <span className="sr-only">
                          {version.latest ? 'Current draft snapshot cannot be deleted' : 'Select snapshot for bulk delete'}
                        </span>
                        <input
                          checked={!version.latest && (bulkVersions?.selectedIds.includes(version.id) ?? false)}
                          className="mt-0.5 h-4 w-4 rounded border border-input accent-primary disabled:cursor-not-allowed"
                          disabled={version.latest || selectionLocked}
                          onChange={() => {
                            if (!version.latest) {
                              bulkVersions?.onToggle(version.id)
                            }
                          }}
                          type="checkbox"
                        />
                      </label>
                      <span className="w-5 pt-0.5 text-right text-xs font-medium tabular-nums text-muted-foreground">
                        {index + 1}.
                      </span>
                    </div>
                  ) : (
                    <span
                      aria-hidden
                      className="shrink-0 pt-0.5 text-xs font-medium tabular-nums text-muted-foreground sm:w-6 sm:text-right"
                    >
                      {index + 1}.
                    </span>
                  )}
                  <div className="grid min-w-0 flex-1 gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{version.title}</span>
                      <Badge variant={version.status === 'published' ? 'secondary' : 'outline'}>{version.status}</Badge>
                      {version.latest ? <Badge variant="outline">Current draft</Badge> : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {version.pagePath} · Saved {formatComposerTimestamp(version.updatedAt)}
                    </div>
                  </div>
                </div>

                <Button
                  disabled={savingAction !== null || restoringVersionId !== null}
                  onClick={() => void restorePageVersion(version)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {restoringVersionId === version.id ? (
                    <>
                      <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <Undo2Icon className="h-4 w-4" />
                      Restore draft
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-sm text-muted-foreground">Save or publish this page to start building draft history.</div>
      )}
    </div>
  )
}
