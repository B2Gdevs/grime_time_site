'use client'

import { PageComposerDrawerPublishDraftCard } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerPublishDraftCard'
import { PageComposerDrawerPublishEmptyState } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerPublishEmptyState'
import { PageComposerDrawerPublishHistoryCard } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerPublishHistoryCard'
import { PageComposerDrawerPublishOverviewCard } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerPublishOverviewCard'
import { PageComposerDrawerPublishReviewCard } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerPublishReviewCard'
import { PageComposerDrawerPublishRouteCard } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerPublishRouteCard'
import type { PageComposerDocument, PageComposerVersionSummary } from '@/lib/pages/pageComposer'
import type { ValidationSummary } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerPublishTypes'

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
  if (loading) {
    return <PageComposerDrawerPublishEmptyState>Loading publish controls...</PageComposerDrawerPublishEmptyState>
  }

  if (!draftPage) {
    return <PageComposerDrawerPublishEmptyState>No page is available for this route.</PageComposerDrawerPublishEmptyState>
  }

  return (
    <div className="grid gap-4">
      <PageComposerDrawerPublishOverviewCard draftPage={draftPage} />

      <div className="grid gap-3 md:grid-cols-2">
        <PageComposerDrawerPublishRouteCard slugDraft={slugDraft} visibilityDraft={visibilityDraft} />
        <PageComposerDrawerPublishDraftCard changedBlockCount={changedBlockCount} dirty={dirty} sectionCount={sectionCount} />
      </div>

      <PageComposerDrawerPublishReviewCard validationSummary={validationSummary} />

      <PageComposerDrawerPublishHistoryCard
        pageVersions={pageVersions}
        restorePageVersion={restorePageVersion}
        restoringVersionId={restoringVersionId}
        savingAction={savingAction}
      />
    </div>
  )
}
