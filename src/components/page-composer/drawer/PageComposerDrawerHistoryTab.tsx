'use client'

import { PageComposerDrawerPublishEmptyState } from '@/components/page-composer/drawer/PageComposerDrawerPublishEmptyState'
import { PageComposerDrawerPublishHistoryCard } from '@/components/page-composer/drawer/PageComposerDrawerPublishHistoryCard'
import type { PageComposerDocument, PageComposerVersionSummary } from '@/lib/pages/pageComposer'

export function PageComposerDrawerHistoryTab({
  bulkDeleteBusy,
  bulkVersions,
  draftPage,
  loading,
  pageVersions,
  restoringVersionId,
  savingAction,
  restorePageVersion,
}: {
  bulkDeleteBusy: boolean
  bulkVersions: {
    onClear: () => void
    onRequestDelete: () => void
    onSelectAll: () => void
    onToggle: (versionId: string) => void
    selectedIds: string[]
  }
  draftPage: null | PageComposerDocument
  loading: boolean
  pageVersions: PageComposerVersionSummary[]
  restoringVersionId: null | string
  savingAction: null | 'publish-page' | 'save-draft'
  restorePageVersion: (version: PageComposerVersionSummary) => Promise<void>
}) {
  if (loading) {
    return <PageComposerDrawerPublishEmptyState>Loading draft history...</PageComposerDrawerPublishEmptyState>
  }

  if (!draftPage) {
    return <PageComposerDrawerPublishEmptyState>No page is available for this route.</PageComposerDrawerPublishEmptyState>
  }

  return (
    <div className="grid gap-4">
      <PageComposerDrawerPublishHistoryCard
        bulkDeleteBusy={bulkDeleteBusy}
        bulkVersions={bulkVersions}
        pageVersions={pageVersions}
        restorePageVersion={restorePageVersion}
        restoringVersionId={restoringVersionId}
        savingAction={savingAction}
      />
    </div>
  )
}
