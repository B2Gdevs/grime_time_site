'use client'

import { DndContext, type DragEndEvent, closestCenter, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { PlusIcon } from 'lucide-react'

import { PageComposerDrawerSortableSectionRow } from '@/components/page-composer/drawer/PageComposerDrawerSortableSectionRow'
import { PageComposerDrawerStructureInsertButton } from '@/components/page-composer/drawer/PageComposerDrawerStructureInsertButton'
import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Button } from '@/components/ui/button'
import type { PageComposerDocument, PageComposerSectionSummary } from '@/lib/pages/pageComposer'

export function PageComposerDrawerStructureTab({
  draftPage,
  handleDragEnd,
  heroSummary: _heroSummary,
  layoutSectionSummaries,
  loading,
  openBlockLibrary,
  removeBlock,
  sectionSummaries,
  selectedIndex,
  sensors,
  setSelectedIndex,
  status,
  toggleBlockHidden,
  duplicateBlock,
}: {
  draftPage: null | PageComposerDocument
  handleDragEnd: (event: DragEndEvent) => void
  heroSummary: null | PageComposerSectionSummary
  layoutSectionSummaries: PageComposerSectionSummary[]
  loading: boolean
  openBlockLibrary: (index: number, mode?: 'insert' | 'replace') => void
  removeBlock: (index: number) => void
  sectionSummaries: PageComposerSectionSummary[]
  selectedIndex: number
  sensors: ReturnType<typeof useSensors>
  setSelectedIndex: (index: number) => void
  status: null | string
  toggleBlockHidden: (index: number) => void
  duplicateBlock: (index: number) => void
}) {
  if (loading) {
    return <div className={adminPanelChrome.panelEmptyMuted}>Loading page structure...</div>
  }

  if (!draftPage) {
    return <div className={adminPanelChrome.panelEmptyMuted}>{status || 'No page is available for this route.'}</div>
  }

  return (
    <div className="grid gap-4">
      <div className={adminPanelChrome.toolbarRow}>
        <div className="text-sm text-muted-foreground">
          {sectionSummaries.length} composer region{sectionSummaries.length === 1 ? '' : 's'}
        </div>
        <Button onClick={() => openBlockLibrary(layoutSectionSummaries.length)} size="sm" type="button" variant="outline">
          <PlusIcon className="h-4 w-4" />
          Add block
        </Button>
      </div>

      {sectionSummaries.length ? (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
          <SortableContext items={layoutSectionSummaries.map((summary) => String(summary.index))} strategy={verticalListSortingStrategy}>
            <div className="grid gap-3">
              <PageComposerDrawerStructureInsertButton onClick={() => openBlockLibrary(0)} />
              {layoutSectionSummaries.map((summary) => (
                <div className="grid gap-3" key={`${summary.index}-${summary.label}`}>
                  <PageComposerDrawerSortableSectionRow
                    active={selectedIndex === summary.index}
                    onAddBelow={() => openBlockLibrary(summary.index + 1)}
                    onClick={() => setSelectedIndex(summary.index)}
                    onDuplicate={() => duplicateBlock(summary.index)}
                    onRemove={() => removeBlock(summary.index)}
                    onToggleHidden={() => toggleBlockHidden(summary.index)}
                    summary={summary}
                  />
                  <PageComposerDrawerStructureInsertButton onClick={() => openBlockLibrary(summary.index + 1)} />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid gap-3">
          <div className={adminPanelChrome.panelDashedEmpty}>This page does not have any layout blocks yet.</div>
          <PageComposerDrawerStructureInsertButton onClick={() => openBlockLibrary(0)} />
        </div>
      )}
    </div>
  )
}
