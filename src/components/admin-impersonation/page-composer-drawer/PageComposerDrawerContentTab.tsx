'use client'

import type { PageComposerDocument, PageComposerSectionSummary } from '@/lib/pages/pageComposer'
import type { ReusableAwareLayoutBlock } from '@/lib/pages/pageComposerReusableBlocks'
import type { ServiceGridBlock } from '@/payload-types'

import { PageComposerDrawerContentEmptyState } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerContentEmptyState'
import { PageComposerDrawerLinkedReusablePresetPanel } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerLinkedReusablePresetPanel'
import { PageComposerDrawerLinkedSharedSectionPanel } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerLinkedSharedSectionPanel'
import { PageComposerDrawerSelectedBlockPanel } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerSelectedBlockPanel'
import { PageComposerDrawerServiceGridEditor } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerServiceGridEditor'

export function PageComposerDrawerContentTab({
  draftPage,
  loading,
  openBlockLibrary,
  openSharedSectionSourceEditor,
  removeBlock,
  selectedBlock,
  selectedBlockIsLinkedSharedSection,
  selectedIndex,
  selectedSharedSectionId,
  selectedSummary,
  status,
  detachReusableBlock,
  mutateSelectedServiceGrid,
  mutateSelectedService,
}: {
  detachReusableBlock: (index: number) => void
  draftPage: null | PageComposerDocument
  loading: boolean
  mutateSelectedService: (serviceIndex: number, mutator: (service: NonNullable<ServiceGridBlock['services']>[number]) => NonNullable<ServiceGridBlock['services']>[number]) => void
  mutateSelectedServiceGrid: (mutator: (block: ServiceGridBlock) => ServiceGridBlock) => void
  openBlockLibrary: (index: number, mode?: 'insert' | 'replace') => void
  openSharedSectionSourceEditor: (id: number) => void
  removeBlock: (index: number) => void
  selectedBlock: ReusableAwareLayoutBlock | null
  selectedBlockIsLinkedSharedSection: boolean
  selectedIndex: number
  selectedSharedSectionId: null | number
  selectedSummary: null | PageComposerSectionSummary
  status: null | string
}) {
  if (loading) {
    return <PageComposerDrawerContentEmptyState>Loading section editor...</PageComposerDrawerContentEmptyState>
  }

  if (!draftPage) {
    return <PageComposerDrawerContentEmptyState>{status || 'No page is available for this route.'}</PageComposerDrawerContentEmptyState>
  }

  if (selectedIndex < 0) {
    return (
      <PageComposerDrawerContentEmptyState>
        Hero copy and hero media edit directly on the live canvas. Click the hero content on the page to update it inline.
      </PageComposerDrawerContentEmptyState>
    )
  }

  if (!selectedBlock) {
    return <PageComposerDrawerContentEmptyState>Select a section on the live page to edit its content.</PageComposerDrawerContentEmptyState>
  }

  if (selectedBlockIsLinkedSharedSection && selectedSharedSectionId) {
    return (
      <PageComposerDrawerLinkedSharedSectionPanel
        detachReusableBlock={detachReusableBlock}
        openBlockLibrary={openBlockLibrary}
        openSharedSectionSourceEditor={openSharedSectionSourceEditor}
        removeBlock={removeBlock}
        selectedIndex={selectedIndex}
        selectedSharedSectionId={selectedSharedSectionId}
      />
    )
  }

  if ((selectedBlock as ReusableAwareLayoutBlock).composerReusable?.mode === 'linked') {
    return (
      <PageComposerDrawerLinkedReusablePresetPanel
        detachReusableBlock={detachReusableBlock}
        openBlockLibrary={openBlockLibrary}
        removeBlock={removeBlock}
        selectedIndex={selectedIndex}
      />
    )
  }

  if (selectedBlock.blockType === 'serviceGrid') {
    return (
      <PageComposerDrawerServiceGridEditor
        mutateSelectedService={mutateSelectedService}
        mutateSelectedServiceGrid={mutateSelectedServiceGrid}
        selectedBlock={selectedBlock as ServiceGridBlock}
      />
    )
  }

  return (
    <PageComposerDrawerSelectedBlockPanel
      openBlockLibrary={openBlockLibrary}
      selectedIndex={selectedIndex}
      selectedSummary={selectedSummary}
    />
  )
}


