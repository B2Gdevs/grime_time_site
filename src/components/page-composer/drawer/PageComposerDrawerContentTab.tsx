'use client'

import type { PageComposerDocument, PageComposerSectionSummary } from '@/lib/pages/pageComposer'
import type { ReusableAwareLayoutBlock } from '@/lib/pages/pageComposerReusableBlocks'
import type { HeroBlock, ServiceGridBlock } from '@/payload-types'

import { PageComposerDrawerContentEmptyState } from '@/components/page-composer/drawer/PageComposerDrawerContentEmptyState'
import { PageComposerDrawerHeroEditor } from '@/components/page-composer/drawer/PageComposerDrawerHeroEditor'
import { PageComposerDrawerLinkedReusablePresetPanel } from '@/components/page-composer/drawer/PageComposerDrawerLinkedReusablePresetPanel'
import { PageComposerDrawerLinkedSharedSectionPanel } from '@/components/page-composer/drawer/PageComposerDrawerLinkedSharedSectionPanel'
import { PageComposerDrawerSelectedBlockPanel } from '@/components/page-composer/drawer/PageComposerDrawerSelectedBlockPanel'
import { PageComposerDrawerServiceGridEditor } from '@/components/page-composer/drawer/PageComposerDrawerServiceGridEditor'

export function PageComposerDrawerContentTab({
  detachReusableBlock,
  draftPage,
  heroCopy,
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
  selectedHeroBlock,
  selectedIndex,
  selectedSharedSectionId,
  selectedSummary,
  status,
  updateHeroCopy,
  updateHeroField,
}: {
  detachReusableBlock: (index: number) => void
  draftPage: null | PageComposerDocument
  heroCopy: string
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
  selectedHeroBlock: HeroBlock | null
  selectedIndex: number
  selectedSharedSectionId: null | number
  selectedSummary: null | PageComposerSectionSummary
  status: null | string
  updateHeroCopy: (value: string) => void
  updateHeroField: (
    field:
      | 'eyebrow'
      | 'headlineAccent'
      | 'headlinePrimary'
      | 'panelBody'
      | 'panelEyebrow'
      | 'panelHeading',
    value: string,
  ) => void
}) {
  if (loading) {
    return <PageComposerDrawerContentEmptyState>Loading block launcher...</PageComposerDrawerContentEmptyState>
  }

  if (!draftPage) {
    return <PageComposerDrawerContentEmptyState>{status || 'No page is available for this route.'}</PageComposerDrawerContentEmptyState>
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
      <PageComposerDrawerSelectedBlockPanel
        openBlockLibrary={openBlockLibrary}
        selectedBlockType={resolvedSelectedBlock.blockType}
        selectedIndex={selectedIndex}
        selectedSummary={selectedSummary}
      >
        <PageComposerDrawerServiceGridEditor
          mutateSelectedService={mutateSelectedService}
          mutateSelectedServiceGrid={mutateSelectedServiceGrid}
          onOpenMediaSlot={onOpenMediaSlot}
          selectedBlock={resolvedSelectedBlock as ServiceGridBlock}
          selectedLayoutIndex={selectedIndex}
        />
      </PageComposerDrawerSelectedBlockPanel>
    )
  }

  if (resolvedSelectedBlock?.blockType === 'heroBlock' && selectedHeroBlock) {
    return (
      <PageComposerDrawerSelectedBlockPanel
        openBlockLibrary={openBlockLibrary}
        selectedBlockType={resolvedSelectedBlock.blockType}
        selectedIndex={selectedIndex}
        selectedSummary={selectedSummary}
      >
        <PageComposerDrawerHeroEditor
          heroBlock={selectedHeroBlock}
          heroCopy={heroCopy}
          onOpenMediaSlot={onOpenMediaSlot}
          selectedIndex={selectedIndex}
          updateCopy={updateHeroCopy}
          updateField={updateHeroField}
        />
      </PageComposerDrawerSelectedBlockPanel>
    )
  }

  return (
    <PageComposerDrawerSelectedBlockPanel
      openBlockLibrary={openBlockLibrary}
      selectedBlockType={resolvedSelectedBlock?.blockType || selectedBlock.blockType}
      selectedIndex={selectedIndex}
      selectedSummary={selectedSummary}
    />
  )
}
