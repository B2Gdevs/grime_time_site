'use client'

import type { ReactNode } from 'react'
import { HistoryIcon, LoaderCircleIcon, Undo2Icon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { formatComposerTimestamp } from '@/utilities/formatComposerTimestamp'
import { pageSlugToFrontendPath, type PageComposerDocument, type PageComposerVersionSummary } from '@/lib/pages/pageComposer'

type ValidationIssue = {
  blockIndex: null | number
  id: string
  message: string
  tone: 'default' | 'warning'
}

type ValidationSummary = {
  issues: ValidationIssue[]
  pageStatus: 'draft' | 'published'
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className={adminPanelChrome.panelEmptyMuted}>{children}</div>
}

export function PageComposerDrawerPublishTab({
  changedBlockCount,
  dirty,
  draftPage,
  loading,
  pageVersions,
  restoringVersionId,
  savingAction,
  sectionCount,
  slugDraft,
  validationSummary,
  visibilityDraft,
  restorePageVersion,
}: {
  changedBlockCount: number
  dirty: boolean
  draftPage: null | PageComposerDocument
  loading: boolean
  pageVersions: PageComposerVersionSummary[]
  restoringVersionId: null | string
  savingAction: null | 'publish-page' | 'save-draft'
  sectionCount: number
  slugDraft: string
  validationSummary: null | ValidationSummary
  visibilityDraft: 'private' | 'public'
  restorePageVersion: (version: PageComposerVersionSummary) => Promise<void>
}) {
  return (
    <>
      {loading ? (
        <EmptyState>Loading publish controls...</EmptyState>
      ) : !draftPage ? (
        <EmptyState>No page is available for this route.</EmptyState>
      ) : (
        <div className="grid gap-4">
          <div className={adminPanelChrome.card}>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-foreground">{draftPage.title}</div>
              <Badge variant="outline">{draftPage._status || 'draft'}</Badge>
              <Badge variant="secondary">{draftPage.visibility || 'public'}</Badge>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Updated {formatComposerTimestamp(draftPage.updatedAt)} · Published {formatComposerTimestamp(draftPage.publishedAt)}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className={adminPanelChrome.card}>
              <div className={adminPanelChrome.fieldLabel}>Route</div>
              <div className="mt-2 text-sm font-semibold text-foreground">{pageSlugToFrontendPath(slugDraft)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {visibilityDraft === 'private' ? 'Private until you change visibility.' : 'Public when published.'}
              </div>
            </div>

            <div className={adminPanelChrome.card}>
              <div className={adminPanelChrome.fieldLabel}>Current draft</div>
              <div className="mt-2 text-sm font-semibold text-foreground">
                {dirty ? 'Unsaved changes ready to review.' : 'Draft matches the last saved state.'}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {sectionCount} block{sectionCount === 1 ? '' : 's'} in this page · {changedBlockCount} changed block
                {changedBlockCount === 1 ? '' : 's'}.
              </div>
            </div>
          </div>

          <div className={adminPanelChrome.card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className={adminPanelChrome.fieldLabel}>Publish review</div>
                <div className="mt-2 text-sm font-semibold text-foreground">
                  {validationSummary?.pageStatus === 'published' ? 'Published page with active draft edits' : 'Draft page'}
                </div>
              </div>
              <Badge variant={validationSummary?.issues.length ? 'outline' : 'secondary'}>
                {validationSummary?.issues.length || 0} validation issue{validationSummary?.issues.length === 1 ? '' : 's'}
              </Badge>
            </div>

            {validationSummary?.issues.length ? (
              <div className="mt-4 grid gap-2">
                {validationSummary.issues.map((issue) => (
                  <div
                    className={`rounded-2xl border px-3 py-3 text-sm ${
                      issue.tone === 'warning'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100'
                        : 'border-border/70 bg-background/70 text-muted-foreground'
                    }`}
                    key={issue.id}
                  >
                    {issue.blockIndex !== null ? `Block ${issue.blockIndex + 1}: ` : ''}
                    {issue.message}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-sm text-muted-foreground">Validation is clear for the currently supported composer checks.</div>
            )}
          </div>

          <div className={adminPanelChrome.card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className={cn('flex items-center gap-2', adminPanelChrome.fieldLabel)}>
                  <HistoryIcon className="h-3.5 w-3.5" />
                  Version history
                </div>
                <div className="mt-2 text-sm font-semibold text-foreground">Restore an earlier snapshot into draft state</div>
              </div>
              <Badge variant="outline">
                {pageVersions.length} version{pageVersions.length === 1 ? '' : 's'}
              </Badge>
            </div>

            {pageVersions.length ? (
              <div className="mt-4 grid gap-3">
                {pageVersions.map((version) => (
                  <div className={adminPanelChrome.versionNest} key={version.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="grid gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{version.title}</span>
                          <Badge variant={version.status === 'published' ? 'secondary' : 'outline'}>{version.status}</Badge>
                          {version.latest ? <Badge variant="outline">Current draft</Badge> : null}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {version.pagePath} · Saved {formatComposerTimestamp(version.updatedAt)}
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
              <div className="mt-3 text-sm text-muted-foreground">Save or publish this page to start building version history.</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
