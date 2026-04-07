'use client'

import { HistoryIcon, LoaderCircleIcon, Undo2Icon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { formatComposerTimestamp } from '@/utilities/formatComposerTimestamp'
import type { PageComposerVersionSummary } from '@/lib/pages/pageComposer'

export function PageComposerDrawerPublishHistoryCard({
  pageVersions,
  restoringVersionId,
  savingAction,
  restorePageVersion,
}: {
  pageVersions: PageComposerVersionSummary[]
  restoringVersionId: null | string
  savingAction: null | 'publish-page' | 'save-draft'
  restorePageVersion: (version: PageComposerVersionSummary) => Promise<void>
}) {
  return (
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
  )
}
