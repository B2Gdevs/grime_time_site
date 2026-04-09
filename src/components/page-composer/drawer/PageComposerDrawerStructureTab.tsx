'use client'

import { useSyncExternalStore } from 'react'
import { DndContext, type DragEndEvent, closestCenter, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { PlusIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { PageComposerDrawerSortableSectionRow } from '@/components/page-composer/drawer/PageComposerDrawerSortableSectionRow'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { PageComposerDocument, PageComposerSectionSummary } from '@/lib/pages/pageComposer'

function subscribeToMountedState() {
  return () => {}
}

function LayoutSectionRows({
  duplicateBlock,
  layoutSectionSummaries,
  moveBlock,
  openBlockLibrary,
  removeBlock,
  selectedIndex,
  setSelectedIndex,
  toggleBlockHidden,
}: {
  duplicateBlock: (index: number) => void
  layoutSectionSummaries: PageComposerSectionSummary[]
  moveBlock: (identity: string, direction: -1 | 1) => void
  openBlockLibrary: (index: number, mode?: 'insert' | 'replace') => void
  removeBlock: (index: number) => void
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  toggleBlockHidden: (index: number) => void
}) {
  return (
    <div className="grid gap-3">
      {layoutSectionSummaries.map((summary) => (
        <PageComposerDrawerSortableSectionRow
          active={selectedIndex === summary.index}
          canMoveDown={summary.blockType !== 'heroBlock' && summary.index < layoutSectionSummaries.length - 1}
          canMoveUp={summary.index > 1}
          disableSorting={summary.blockType === 'heroBlock' && summary.index === 0}
          key={summary.identity}
          onClick={() => setSelectedIndex(summary.index)}
          onDuplicate={() => duplicateBlock(summary.index)}
          onMoveDown={() => moveBlock(summary.identity, 1)}
          onMoveUp={() => moveBlock(summary.identity, -1)}
          onRemove={() => removeBlock(summary.index)}
          onReplace={() => {
            setSelectedIndex(summary.index)
            openBlockLibrary(summary.index, 'replace')
          }}
          onToggleHidden={() => toggleBlockHidden(summary.index)}
          summary={summary}
        />
      ))}
    </div>
  )
}

export function PageComposerDrawerStructureTab({
  draftPage,
  duplicateBlock,
  handleDragEnd,
  heroSummary: _heroSummary,
  layoutSectionSummaries,
  loading,
  moveBlock,
  openBlockLibrary,
  removeBlock,
  sectionSummaries,
  selectedIndex,
  sensors,
  setSelectedIndex,
  status,
  toggleBlockHidden,
}: {
  draftPage: null | PageComposerDocument
  duplicateBlock: (index: number) => void
  handleDragEnd: (event: DragEndEvent) => void
  heroSummary: null | PageComposerSectionSummary
  layoutSectionSummaries: PageComposerSectionSummary[]
  loading: boolean
  moveBlock: (identity: string, direction: -1 | 1) => void
  openBlockLibrary: (index: number, mode?: 'insert' | 'replace') => void
  removeBlock: (index: number) => void
  sectionSummaries: PageComposerSectionSummary[]
  selectedIndex: number
  sensors: ReturnType<typeof useSensors>
  setSelectedIndex: (index: number) => void
  status: null | string
  toggleBlockHidden: (index: number) => void
}) {
  const sortableReady = useSyncExternalStore(subscribeToMountedState, () => true, () => false)

  if (loading) {
    return <div className={adminPanelChrome.panelEmptyMuted}>Loading page layout...</div>
  }

  if (!draftPage) {
    return <div className={adminPanelChrome.panelEmptyMuted}>{status || 'No page is available for this route.'}</div>
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid gap-4">
        <section className="rounded-2xl border border-border/70 bg-card/50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Layout</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Drag blocks to reorder the page. Replace a block in place, or add a new one to the bottom.
              </p>
            </div>
            <Button
              onClick={() => openBlockLibrary(layoutSectionSummaries.length)}
              size="sm"
              type="button"
              variant="outline"
            >
              <PlusIcon className="h-4 w-4" />
              Add to bottom
            </Button>
          </div>
          <div className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {sectionSummaries.length} block{sectionSummaries.length === 1 ? '' : 's'}
          </div>
        </section>

        {layoutSectionSummaries.length ? (
          sortableReady ? (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
              <SortableContext
                items={layoutSectionSummaries.map((summary) => summary.identity)}
                strategy={verticalListSortingStrategy}
              >
                <LayoutSectionRows
                  duplicateBlock={duplicateBlock}
                  layoutSectionSummaries={layoutSectionSummaries}
                  moveBlock={moveBlock}
                  openBlockLibrary={openBlockLibrary}
                  removeBlock={removeBlock}
                  selectedIndex={selectedIndex}
                  setSelectedIndex={setSelectedIndex}
                  toggleBlockHidden={toggleBlockHidden}
                />
              </SortableContext>
            </DndContext>
          ) : (
            <LayoutSectionRows
              duplicateBlock={duplicateBlock}
              layoutSectionSummaries={layoutSectionSummaries}
              moveBlock={moveBlock}
              openBlockLibrary={openBlockLibrary}
              removeBlock={removeBlock}
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
              toggleBlockHidden={toggleBlockHidden}
            />
          )
        ) : (
          <div className="grid gap-3">
            <div className={adminPanelChrome.panelDashedEmpty}>This page does not have any layout blocks yet.</div>
            <Button onClick={() => openBlockLibrary(0)} size="sm" type="button" variant="outline">
              <PlusIcon className="h-4 w-4" />
              Add first block
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
