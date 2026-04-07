'use client'

import type { ReactNode } from 'react'
import { XIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SharedSectionRecord } from '@/lib/pages/sharedSections'

type BlockDefinition = {
  category: string
  description: string
  label: string
  supportsInsert: boolean
  supportsReusable: boolean
  type: string
}

type ReusablePreset = {
  blockType: string
  description: string
  key: string
  label: string
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className={adminPanelChrome.panelEmptyMuted}>{children}</div>
}

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
}: {
  blockLibraryMode: 'insert' | 'replace'
  blockLibraryQuery: string
  blockLibraryTargetIndex: null | number
  closeBlockLibrary: () => void
  filteredBlockDefinitions: BlockDefinition[]
  filteredReusablePresets: ReusablePreset[]
  filteredSharedSections: SharedSectionRecord[]
  insertRegisteredBlock: (type: string) => void
  insertReusablePreset: (args: { key: string; mode: 'detached' | 'linked' }) => void
  insertSharedSection: (args: { item: SharedSectionRecord; mode: 'detached' | 'linked' }) => void
  openSharedSectionSourceEditor: (id: number) => void
  sharedSectionsLoading: boolean
  sharedSectionsStatus: null | string
  setBlockLibraryQuery: (value: string) => void
}) {
  return (
    <div className="fixed right-4 top-[calc(var(--portal-sticky-top)+4.75rem)] z-[120] h-[min(42rem,calc(100vh-7rem))] w-[min(31rem,calc(100vw-1rem))] overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/98 shadow-2xl backdrop-blur-sm">
      <div className={adminPanelChrome.drawerHeaderBetweenStart}>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold text-foreground">Block library</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {blockLibraryMode === 'replace'
              ? `Replace block ${Math.max(1, (blockLibraryTargetIndex ?? 0) + 1)} with another layout, preset, or shared source.`
              : `Insert a block at position ${(blockLibraryTargetIndex ?? 0) + 1}.`}
          </div>
        </div>
        <Button aria-label="Close block library" onClick={closeBlockLibrary} size="icon" type="button" variant="ghost">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid h-[calc(100%-5.5rem)] grid-rows-[auto_minmax(0,1fr)] gap-4 px-5 py-4">
        <Input onChange={(event) => setBlockLibraryQuery(event.target.value)} placeholder="Search blocks" value={blockLibraryQuery} />

        <div className="overflow-y-auto">
          <div className="grid gap-5">
            {filteredBlockDefinitions.length ? (
              <section className="grid gap-3">
                <div className={adminPanelChrome.fieldLabel}>Layouts</div>
                <div className="grid gap-3">
                  {filteredBlockDefinitions.map((definition) => (
                    <button
                      className={`rounded-2xl border p-4 text-left transition ${
                        definition.supportsInsert
                          ? 'border-border/70 bg-card/50 hover:border-primary/40 hover:bg-primary/5'
                          : 'cursor-not-allowed border-border/50 bg-card/30 opacity-65'
                      }`}
                      disabled={!definition.supportsInsert}
                      key={definition.type}
                      onClick={() => (definition.supportsInsert ? insertRegisteredBlock(definition.type) : undefined)}
                      type="button"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-foreground">{definition.label}</div>
                        <Badge variant="outline">{definition.type}</Badge>
                        <Badge variant="outline">{definition.category}</Badge>
                        {definition.supportsReusable ? <Badge variant="secondary">reusable-ready</Badge> : null}
                        {!definition.supportsInsert ? <Badge variant="outline">planned</Badge> : null}
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">{definition.description}</div>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {filteredReusablePresets.length ? (
              <section className="grid gap-3">
                <div className={adminPanelChrome.fieldLabel}>Sections</div>
                <div className="grid gap-3">
                  {filteredReusablePresets.map((preset) => (
                    <div className={adminPanelChrome.card} key={preset.key}>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-foreground">{preset.label}</div>
                        <Badge variant="outline">{preset.blockType}</Badge>
                        <Badge variant="secondary">reusable</Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">{preset.description}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button onClick={() => insertReusablePreset({ key: preset.key, mode: 'linked' })} size="sm" type="button" variant="outline">
                          {blockLibraryMode === 'replace' ? 'Replace with linked' : 'Insert linked'}
                        </Button>
                        <Button onClick={() => insertReusablePreset({ key: preset.key, mode: 'detached' })} size="sm" type="button">
                          {blockLibraryMode === 'replace' ? 'Replace with detached copy' : 'Insert detached copy'}
                        </Button>
                      </div>
                    </div>
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

              {filteredSharedSections.length ? (
                <div className="grid gap-3">
                  {filteredSharedSections.map((item) => (
                    <div className={adminPanelChrome.card} key={`shared-${item.id}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-foreground">{item.name}</div>
                        <Badge variant={item.status === 'published' ? 'secondary' : 'outline'}>{item.status}</Badge>
                        <Badge variant="outline">{item.category}</Badge>
                        <Badge variant="outline">v{item.currentVersion}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {item.description || 'Shared section source ready for linked reuse.'}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.tags.length ? (
                          item.tags.map((tag) => (
                            <Badge key={`${item.id}-${tag}`} variant="secondary">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">No tags</Badge>
                        )}
                        <Badge variant="outline">
                          {item.usageCount} {item.usageCount === 1 ? 'page' : 'pages'}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button onClick={() => insertSharedSection({ item, mode: 'linked' })} size="sm" type="button" variant="outline">
                          {blockLibraryMode === 'replace' ? 'Replace with linked' : 'Insert linked'}
                        </Button>
                        <Button onClick={() => insertSharedSection({ item, mode: 'detached' })} size="sm" type="button">
                          {blockLibraryMode === 'replace' ? 'Replace with detached copy' : 'Insert detached copy'}
                        </Button>
                        <Button onClick={() => openSharedSectionSourceEditor(item.id)} size="sm" type="button" variant="ghost">
                          Edit source
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sharedSectionsLoading ? (
                <EmptyState>Loading published shared sections...</EmptyState>
              ) : (
                <EmptyState>No published shared sections match that search yet.</EmptyState>
              )}
            </section>

            {!filteredBlockDefinitions.length && !filteredReusablePresets.length && !filteredSharedSections.length ? (
              <EmptyState>No layouts, presets, or shared sections match that search.</EmptyState>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
