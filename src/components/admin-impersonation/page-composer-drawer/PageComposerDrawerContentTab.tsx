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
  mutateSelectedService,
  mutateSelectedServiceGrid,
  onOpenMediaSlot,
  openBlockLibrary,
  openSharedSectionSourceEditor,
  removeBlock,
  resolvedSelectedBlock,
  selectedBlock,
  selectedBlockIsLinkedSharedSection,
  selectedIndex,
  selectedSharedSectionId,
  selectedSummary,
  status,
  detachReusableBlock,
}: {
  detachReusableBlock: (index: number) => void
  draftPage: null | PageComposerDocument
  loading: boolean
  mutateSelectedService: (serviceIndex: number, mutator: (service: NonNullable<ServiceGridBlock['services']>[number]) => NonNullable<ServiceGridBlock['services']>[number]) => void
  mutateSelectedServiceGrid: (mutator: (block: ServiceGridBlock) => ServiceGridBlock) => void
  onOpenMediaSlot: (relationPath: string) => void
  openBlockLibrary: (index: number, mode?: 'insert' | 'replace') => void
  openSharedSectionSourceEditor: (id: number) => void
  removeBlock: (index: number) => void
  resolvedSelectedBlock: ReusableAwareLayoutBlock | null
  selectedBlock: ReusableAwareLayoutBlock | null
  selectedBlockIsLinkedSharedSection: boolean
  selectedIndex: number
  selectedSharedSectionId: null | number
  selectedSummary: null | PageComposerSectionSummary
  status: null | string
}) {
  if (loading) {
    return <PageComposerDrawerContentEmptyState>Loading block launcher...</PageComposerDrawerContentEmptyState>
  }

  if (!draftPage) {
    return <PageComposerDrawerContentEmptyState>{status || 'No page is available for this route.'}</PageComposerDrawerContentEmptyState>
  }

  if (selectedIndex < 0) {
    return (
      <PageComposerDrawerContentEmptyState>
        Hero editing stays on the live canvas. Use the page itself to edit copy and media, and use this surface to find blocks for the sections around it.
      </PageComposerDrawerContentEmptyState>
    )
  }

  if (!selectedBlock) {
    return (
      <PageComposerDrawerContentEmptyState>
        Select a section on the live page to manage its block, or use the canvas insert handles to open block search at the correct position.
      </PageComposerDrawerContentEmptyState>
    )
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

  if (resolvedSelectedBlock?.blockType === 'serviceGrid') {
    return (
      <PageComposerDrawerServiceGridEditor
        mutateSelectedService={mutateSelectedService}
        mutateSelectedServiceGrid={mutateSelectedServiceGrid}
        onOpenMediaSlot={onOpenMediaSlot}
        selectedBlock={resolvedSelectedBlock as ServiceGridBlock}
        selectedLayoutIndex={selectedIndex}
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


