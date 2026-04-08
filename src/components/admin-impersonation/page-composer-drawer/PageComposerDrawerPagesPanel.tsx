'use client'

import { InfoIcon } from 'lucide-react'

import { PageComposerDrawerHistoryTab } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerHistoryTab'
import { PageComposerDrawerMarketingRoutesList } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMarketingRoutesList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { PageComposerDocument, PageComposerPageSummary, PageComposerVersionSummary } from '@/lib/pages/pageComposer'

export function PageComposerDrawerPagesPanel({
  bulkDeleteBusy,
  bulkPages,
  bulkVersions,
  currentPath,
  deletingPageId,
  draftPage,
  loading,
  marketingPages,
  onDeletePage,
  onNavigateToPage,
  pageVersions,
  restoringVersionId,
  savingAction,
  restorePageVersion,
}: {
  bulkDeleteBusy: boolean
  bulkPages: {
    onClear: () => void
    onRequestDelete: () => void
    onSelectAll: () => void
    onToggle: (pageId: number) => void
    selectedIds: number[]
  }
  bulkVersions: {
    onClear: () => void
    onRequestDelete: () => void
    onSelectAll: () => void
    onToggle: (versionId: string) => void
    selectedIds: string[]
  }
  currentPath: string
  deletingPageId: null | number
  draftPage: null | PageComposerDocument
  loading: boolean
  marketingPages: PageComposerPageSummary[]
  onDeletePage: (args: { isPublished: boolean; pageId: number; pagePath: string; title: string }) => void | Promise<void>
  onNavigateToPage: (pagePath: string) => void
  pageVersions: PageComposerVersionSummary[]
  restoringVersionId: null | string
  savingAction: null | 'publish-page' | 'save-draft'
  restorePageVersion: (version: PageComposerVersionSummary) => Promise<void>
}) {
  return (
    <div className="grid gap-4">
      <Tabs className="w-full" defaultValue="history">
        <TooltipProvider delayDuration={200}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl p-1">
            <div className="relative min-w-0">
              <TabsTrigger className="w-full pr-8 text-xs sm:text-sm" value="history">
                History
              </TabsTrigger>
              <div
                className="pointer-events-auto absolute right-1.5 top-1/2 z-10 -translate-y-1/2"
                data-page-composer-no-drag="true"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      aria-label="About the History tab"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      type="button"
                    >
                      <InfoIcon aria-hidden className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] text-xs leading-snug" side="bottom">
                    Saved snapshots for the page open in the preview (CMS versions). Restore loads one into your current
                    draft. Open other marketing routes from the Pages tab.
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="relative min-w-0">
              <TabsTrigger className="w-full pr-8 text-xs sm:text-sm" value="routes">
                Pages
              </TabsTrigger>
              <div
                className="pointer-events-auto absolute right-1.5 top-1/2 z-10 -translate-y-1/2"
                data-page-composer-no-drag="true"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      aria-label="About the Pages tab"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      type="button"
                    >
                      <InfoIcon aria-hidden className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] text-xs leading-snug" side="bottom">
                    Lists published marketing routes plus the page you are previewing. Turn on Show all to include every
                    draft-only page document. Snapshot history for the page in the preview stays under History.
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TabsList>
        </TooltipProvider>
        <TabsContent className="mt-4" value="history">
          <PageComposerDrawerHistoryTab
            bulkDeleteBusy={bulkDeleteBusy}
            bulkVersions={bulkVersions}
            draftPage={draftPage}
            loading={loading}
            pageVersions={pageVersions}
            restorePageVersion={restorePageVersion}
            restoringVersionId={restoringVersionId}
            savingAction={savingAction}
          />
        </TabsContent>
        <TabsContent className="mt-4" value="routes">
          <PageComposerDrawerMarketingRoutesList
            bulkDeleteBusy={bulkDeleteBusy}
            bulkPages={bulkPages}
            currentPath={currentPath}
            deletingPageId={deletingPageId}
            loading={loading}
            marketingPages={marketingPages}
            onDeletePage={onDeletePage}
            onNavigateToPage={onNavigateToPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
