'use client'

import { useMemo, useState } from 'react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { PageComposerDrawerBlockDefinitionCard } from '@/components/page-composer/drawer/PageComposerDrawerBlockDefinitionCard'
import { PageComposerDrawerBlockLibraryEmptyState } from '@/components/page-composer/drawer/PageComposerDrawerBlockLibraryEmptyState'
import { PageComposerDrawerBlockLibraryFilters } from '@/components/page-composer/drawer/PageComposerDrawerBlockLibraryFilters'
import { PageComposerDrawerBlockLibraryHeader } from '@/components/page-composer/drawer/PageComposerDrawerBlockLibraryHeader'
import { PageComposerDrawerReusablePresetCard } from '@/components/page-composer/drawer/PageComposerDrawerReusablePresetCard'
import { PageComposerDrawerSharedSectionCard } from '@/components/page-composer/drawer/PageComposerDrawerSharedSectionCard'
import {
  resolveBlockLibraryCategory,
  type BlockLibraryCategory,
  type PageComposerDrawerBlockLibraryProps,
} from '@/components/page-composer/drawer/PageComposerDrawerBlockLibraryTypes'
import { Badge } from '@/components/ui/badge'

export function PageComposerDrawerBlockLibrary({
  blockLibraryMode,
  blockLibraryQuery,
  blockLibraryTargetIndex,
  closeBlockLibrary,
  filteredBlockDefinitions,
  filteredReusablePresets,
  filteredSharedSections,
  insertRegisteredBlock,
  insertReusablePreset,
  insertSharedSection,
  openSharedSectionSourceEditor,
  sharedSectionsLoading,
  sharedSectionsStatus,
  setBlockLibraryQuery,
}: PageComposerDrawerBlockLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<BlockLibraryCategory>('all')
  const visibleBlockDefinitions = useMemo(() => {
    if (activeCategory === 'all' || activeCategory === 'shared') {
      return filteredBlockDefinitions
    }

    if (activeCategory === 'hero') {
      return filteredBlockDefinitions.filter((definition) => definition.type === 'heroBlock')
    }

    return filteredBlockDefinitions.filter((definition) => resolveBlockLibraryCategory(definition.type) === activeCategory)
  }, [activeCategory, filteredBlockDefinitions])
  const visibleReusablePresets = useMemo(() => {
    if (activeCategory === 'all') {
      return filteredReusablePresets
    }

    if (activeCategory === 'shared' || activeCategory === 'hero') {
      return []
    }

    return filteredReusablePresets.filter((preset) => resolveBlockLibraryCategory(preset.blockType) === activeCategory)
  }, [activeCategory, filteredReusablePresets])
  const visibleSharedSections = useMemo(() => {
    if (activeCategory === 'all' || activeCategory === 'shared') {
      return filteredSharedSections
    }

    return []
  }, [activeCategory, filteredSharedSections])

  return (
    <div className="fixed right-4 top-[calc(var(--portal-sticky-top)+4.75rem)] z-[120] h-[min(42rem,calc(100vh-7rem))] w-[min(31rem,calc(100vw-1rem))] overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/98 shadow-2xl backdrop-blur-sm">
      <PageComposerDrawerBlockLibraryHeader
        blockLibraryMode={blockLibraryMode}
        blockLibraryTargetIndex={blockLibraryTargetIndex}
        closeBlockLibrary={closeBlockLibrary}
      />

      <div className="grid h-[calc(100%-5.5rem)] grid-rows-[auto_minmax(0,1fr)] gap-4 px-5 py-4">
        <PageComposerDrawerBlockLibraryFilters
          activeCategory={activeCategory}
          blockLibraryQuery={blockLibraryQuery}
          setActiveCategory={setActiveCategory}
          setBlockLibraryQuery={setBlockLibraryQuery}
        />

        <div className="overflow-y-auto">
          <div className="grid gap-5">
            {visibleBlockDefinitions.length ? (
              <section className="grid gap-3">
                <div className={adminPanelChrome.fieldLabel}>Layouts</div>
                <div className="grid gap-3">
                  {visibleBlockDefinitions.map((definition) => (
                    <PageComposerDrawerBlockDefinitionCard
                      definition={definition}
                      insertRegisteredBlock={insertRegisteredBlock}
                      key={definition.type}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {visibleReusablePresets.length ? (
              <section className="grid gap-3">
                <div className={adminPanelChrome.fieldLabel}>Sections</div>
                <div className="grid gap-3">
                  {visibleReusablePresets.map((preset) => (
                    <PageComposerDrawerReusablePresetCard
                      blockLibraryMode={blockLibraryMode}
                      insertReusablePreset={insertReusablePreset}
                      key={preset.key}
                      preset={preset}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className={adminPanelChrome.fieldLabel}>Shared sections</div>
                {sharedSectionsLoading ? <Badge variant="outline">Loading</Badge> : null}
              </div>

              {sharedSectionsStatus ? <div className={adminPanelChrome.warnAmberCompact}>{sharedSectionsStatus}</div> : null}

              {visibleSharedSections.length ? (
                <div className="grid gap-3">
                  {visibleSharedSections.map((item) => (
                    <PageComposerDrawerSharedSectionCard
                      blockLibraryMode={blockLibraryMode}
                      insertSharedSection={insertSharedSection}
                      item={item}
                      key={`shared-${item.id}`}
                      openSharedSectionSourceEditor={openSharedSectionSourceEditor}
                    />
                  ))}
                </div>
              ) : sharedSectionsLoading && (activeCategory === 'all' || activeCategory === 'shared') ? (
                <PageComposerDrawerBlockLibraryEmptyState>
                  Loading published shared sections...
                </PageComposerDrawerBlockLibraryEmptyState>
              ) : activeCategory === 'all' || activeCategory === 'shared' ? (
                <PageComposerDrawerBlockLibraryEmptyState>
                  No published shared sections match that search yet.
                </PageComposerDrawerBlockLibraryEmptyState>
              ) : null}
            </section>

            {!visibleBlockDefinitions.length && !visibleReusablePresets.length && !visibleSharedSections.length ? (
              <PageComposerDrawerBlockLibraryEmptyState>
                No blocks match that search and category yet.
              </PageComposerDrawerBlockLibraryEmptyState>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
