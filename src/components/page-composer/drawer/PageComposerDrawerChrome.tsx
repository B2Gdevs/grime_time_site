'use client'

import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { GripVerticalIcon, ImageIcon, InfoIcon, LayoutListIcon, Minimize2Icon, TypeIcon, XIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { PageComposerDrawerBlockLibrary } from '@/components/page-composer/drawer/PageComposerDrawerBlockLibrary'
import { PageComposerDrawerContentTab } from '@/components/page-composer/drawer/PageComposerDrawerContentTab'
import { PageComposerDrawerFooter } from '@/components/page-composer/drawer/PageComposerDrawerFooter'
import { PageComposerDrawerPagesPanel } from '@/components/page-composer/drawer/PageComposerDrawerPagesPanel'
import { PageComposerDrawerMediaTab } from '@/components/page-composer/drawer/PageComposerDrawerMediaTab'
import { PageComposerDrawerStructureTab } from '@/components/page-composer/drawer/PageComposerDrawerStructureTab'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { DragEndEvent } from '@dnd-kit/core'
import type { PageComposerTab } from '@/components/page-composer/PageComposerContext'
import type {
  PageComposerDocument,
  PageComposerPageSummary,
  PageComposerSectionSummary,
  PageComposerVersionSummary,
} from '@/lib/pages/pageComposer'
import type { Media, ServiceGridBlock } from '@/payload-types'
import type { MediaAction, SectionMediaSlot } from '@/components/page-composer/drawer/PageComposerDrawerMediaTypes'
import type {
  PageComposerBlockDefinition,
  PageComposerInsertableBlockType,
} from '@/lib/pages/pageComposerBlockRegistry'
import type { ReusableAwareLayoutBlock } from '@/lib/pages/pageComposerReusableBlocks'
type ReusablePreset = {
  blockType: string
  description: string
  key: string
  label: string
}

export type PageComposerDrawerChromeProps = {
  activeTab: PageComposerTab
  blockLibrary: {
    blockLibraryMode: 'insert' | 'replace'
    blockLibraryQuery: string
    blockLibraryTargetIndex: null | number
    closeBlockLibrary: () => void
    filteredBlockDefinitions: PageComposerBlockDefinition[]
    filteredReusablePresets: ReusablePreset[]
    insertRegisteredBlock: (type: PageComposerInsertableBlockType) => void
    insertReusablePreset: (args: { key: string; mode: 'detached' | 'linked' }) => void
    isBlockLibraryOpen: boolean
    setBlockLibraryQuery: (value: string) => void
  }
  embedded: boolean
  /** When true, the composer session is bound to the live marketing route for this URL (see `composerPagePathForPathname`). */
  livePageEditingActive?: boolean
  onDismiss: () => void
  /** Collapse the floating drawer while keeping the compose session active (launcher returns). */
  onMinimizePanel?: () => void
  /** Turn live page editing on/off for the current route (close session vs open and bind to route). */
  onToggleLivePageEditing?: (enabled: boolean) => void
  onStartDrag: (event: ReactPointerEvent<HTMLElement>) => void
  page: {
    draftPage: null | PageComposerDocument
    loading: boolean
    status: null | string
  }
  sections: {
    duplicateBlock: (index: number) => void
    handleDragEnd: (event: DragEndEvent) => void
    heroCopy: string
    heroSummary: null | PageComposerSectionSummary
    layoutSectionSummaries: PageComposerSectionSummary[]
    moveBlock: (identity: string, direction: -1 | 1) => void
    openBlockLibrary: (index: number, mode?: 'insert' | 'replace') => void
    sensors: unknown
    removeBlock: (index: number) => void
    selectedBlock: ReusableAwareLayoutBlock | null
    resolvedSelectedBlock: ReusableAwareLayoutBlock | null
    selectedHeroBlock: Extract<ReusableAwareLayoutBlock, { blockType: 'heroBlock' }> | null
    selectedIndex: number
    selectedSummary: null | PageComposerSectionSummary
    sectionSummaries: PageComposerSectionSummary[]
    setSelectedIndex: (value: number) => void
    toggleBlockHidden: (index: number) => void
    detachReusableBlock: (index: number) => void
    mutateSelectedService: (
      serviceIndex: number,
      mutator: (service: NonNullable<ServiceGridBlock['services']>[number]) => NonNullable<ServiceGridBlock['services']>[number],
    ) => void
    mutateSelectedServiceGrid: (mutator: (block: ServiceGridBlock) => ServiceGridBlock) => void
    onOpenMediaSlot: (relationPath: string) => void
    selectedServiceGrid: ServiceGridBlock | null
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
  }
  media: {
    copilot: null | {
      openFocusedMediaSession: (args: { mode?: 'image' | 'video'; promptHint?: string }) => void
    }
    dirty: boolean
    draftPage: null | PageComposerDocument
    loadMediaLibrary: () => void
    mediaActionsLocked: boolean
    mediaKind: 'image' | 'video'
    mediaLibrary: Array<{
      alt: null | string
      filename: null | string
      id: number
      media: Media
      mimeType: null | string
      previewUrl: null | string
      updatedAt: string
    }>
    mediaLoading: boolean
    mediaSlots: SectionMediaSlot[]
    mediaPrompt: string
    mediaPromptId: string
    selectedMediaSlot: SectionMediaSlot | null
    mediaUploadInputRef: RefObject<HTMLInputElement | null>
    setMediaKind: (value: 'image' | 'video') => void
    setMediaPrompt: (value: string) => void
    setSelectedMediaPath: (value: null | string) => void
    submitMediaAction: (args: {
      action: MediaAction
      file?: File
      mediaId?: number | null
      prompt?: string
      relationPath?: string
      success: string
    }) => Promise<void>
    submittingMediaAction: null | MediaAction
  }
  history: {
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
    marketingPages: PageComposerPageSummary[]
    onDeletePage: (args: { isPublished: boolean; pageId: number; pagePath: string; title: string }) => void | Promise<void>
    onNavigateToPage: (pagePath: string) => void
    pageVersions: PageComposerVersionSummary[]
    restoringVersionId: null | string
    savingAction: null | 'publish-page' | 'save-draft'
    restorePageVersion: (version: PageComposerVersionSummary) => Promise<void>
    persistPage: (action: 'publish-page' | 'save-draft') => Promise<void>
  }
  tabs: {
    setActiveTab: (value: PageComposerTab) => void
  }
}

export function PageComposerDrawerChrome({
  activeTab,
  blockLibrary,
  embedded,
  livePageEditingActive = false,
  media,
  onDismiss,
  onMinimizePanel,
  onToggleLivePageEditing,
  onStartDrag,
  page,
  history,
  sections,
  tabs,
}: PageComposerDrawerChromeProps) {
  const showInlineAdminBar = !embedded
  const { draftPage, loading, status } = page
  const {
    blockLibraryMode,
    blockLibraryQuery,
    blockLibraryTargetIndex,
    closeBlockLibrary,
    filteredBlockDefinitions,
    filteredReusablePresets,
    insertRegisteredBlock,
    insertReusablePreset,
    isBlockLibraryOpen,
    setBlockLibraryQuery,
  } = blockLibrary
  const {
    duplicateBlock,
    handleDragEnd,
    heroCopy,
    heroSummary,
    layoutSectionSummaries,
    moveBlock,
    openBlockLibrary,
    sensors,
    removeBlock,
    selectedBlock,
    resolvedSelectedBlock,
    selectedHeroBlock,
    selectedIndex,
    selectedSummary,
    sectionSummaries,
    setSelectedIndex,
    toggleBlockHidden,
    detachReusableBlock,
    mutateSelectedService,
    mutateSelectedServiceGrid,
    onOpenMediaSlot,
    selectedServiceGrid: _selectedServiceGrid,
    updateHeroCopy,
    updateHeroField,
  } = sections
  const {
    copilot,
    dirty,
    draftPage: mediaDraftPage,
    loadMediaLibrary,
    mediaActionsLocked,
    mediaKind,
    mediaLibrary,
    mediaLoading,
    mediaSlots,
    mediaPrompt,
    mediaPromptId,
    selectedMediaSlot: _selectedMediaSlot,
    mediaUploadInputRef,
    setMediaKind,
    setMediaPrompt,
    setSelectedMediaPath,
    submitMediaAction,
    submittingMediaAction,
  } = media
  const {
    bulkDeleteBusy,
    bulkPages,
    bulkVersions,
    currentPath,
    deletingPageId,
    marketingPages,
    onDeletePage,
    onNavigateToPage,
    pageVersions,
    restoringVersionId,
    savingAction,
    restorePageVersion,
    persistPage,
  } = history

  return (
    <aside
      aria-label="Page composer"
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border bg-background shadow-2xl"
      role="complementary"
    >
      {!embedded ? (
        <div
          className={`${adminPanelChrome.drawerHeaderBetweenCenter} cursor-grab select-none active:cursor-grabbing`}
          onPointerDown={(event) => {
            const target = event.target as HTMLElement | null

            if (target?.closest('[data-page-composer-no-drag="true"]')) {
              return
            }

            onStartDrag(event)
          }}
        >
          <div className="flex items-center gap-3">
            <button
              aria-label="Move page composer"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 text-muted-foreground"
              onPointerDown={onStartDrag}
              type="button"
            >
              <GripVerticalIcon className="h-4 w-4" />
            </button>
            <div>
              <p className={adminPanelChrome.chromeKicker}>Staff beta</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">Visual composer</h2>
              <h3 className="mt-1 text-lg font-semibold tracking-tight">
                {selectedBlock?.blockName || 'Selected block'} {selectedBlock?.blockType || 'Block type'}
              </h3>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onToggleLivePageEditing ? (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      aria-checked={livePageEditingActive}
                      aria-label={`${livePageEditingActive ? 'Disable' : 'Enable'} live page editing for this route`}
                      className={`relative inline-flex h-8 w-11 shrink-0 items-center rounded-full border transition ${
                        livePageEditingActive
                          ? 'border-primary bg-primary'
                          : 'border-border/70 bg-muted/60'
                      }`}
                      data-page-composer-no-drag="true"
                      onClick={() => onToggleLivePageEditing(!livePageEditingActive)}
                      role="switch"
                      type="button"
                    >
                      <span
                        className={`inline-flex h-5 w-5 rounded-full bg-background shadow-sm transition-transform ${
                          livePageEditingActive ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[240px] text-xs" side="bottom">
                    {livePageEditingActive
                      ? 'Live page editing is on for this URL. Turn off to close the composer for this route.'
                      : 'Turn on to bind the composer to this page and edit blocks, text, and media on the live route.'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
            {onMinimizePanel ? (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label="Minimize composer panel"
                      data-page-composer-no-drag="true"
                      onClick={onMinimizePanel}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Minimize2Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[240px] text-xs" side="bottom">
                    Hide the panel to see more of the page. Your draft and selection stay active — use the edge
                    launcher to expand again.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
            <Button
              aria-label="Dismiss page composer"
              data-page-composer-no-drag="true"
              onClick={onDismiss}
              size="icon"
              type="button"
              variant="ghost"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
        <Tabs
          className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden"
          onValueChange={(value) => tabs.setActiveTab(value as PageComposerTab)}
          value={activeTab}
        >
          {showInlineAdminBar ? (
            <div className={adminPanelChrome.drawerTabsStrip}>
              <TooltipProvider delayDuration={200}>
                <TabsList className="grid h-auto w-full grid-cols-4 gap-1 rounded-xl p-1">
                  <div className="relative min-w-0">
                    <TabsTrigger className="w-full pr-7 text-xs sm:text-sm" value="structure">
                      <span className="inline-flex items-center gap-2">
                        <LayoutListIcon className="h-4 w-4 shrink-0" />
                        Layout
                      </span>
                    </TabsTrigger>
                    <div
                      className="pointer-events-auto absolute right-1 top-1/2 z-10 -translate-y-1/2"
                      data-page-composer-no-drag="true"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="About the Layout tab"
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            type="button"
                          >
                            <InfoIcon aria-hidden className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px] text-xs leading-snug" side="bottom">
                          Reorder the page with drag-and-drop, replace a block in place, and add a new block at the
                          bottom without leaving the composer.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="relative min-w-0">
                    <TabsTrigger className="w-full pr-7 text-xs sm:text-sm" value="content">
                      <span className="inline-flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 shrink-0" />
                        Block data
                      </span>
                    </TabsTrigger>
                    <div
                      className="pointer-events-auto absolute right-1 top-1/2 z-10 -translate-y-1/2"
                      data-page-composer-no-drag="true"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="About the Blocks tab"
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            type="button"
                          >
                            <InfoIcon aria-hidden className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px] text-xs leading-snug" side="bottom">
                          Edit fields for the block selected on the canvas (same data as the inline editor). Open the
                          block library to insert blocks and reusable presets from the layout tab or canvas.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="relative min-w-0">
                    <TabsTrigger className="w-full pr-7 text-xs sm:text-sm" value="media">
                      <span className="inline-flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 shrink-0" />
                        Media
                      </span>
                    </TabsTrigger>
                    <div
                      className="pointer-events-auto absolute right-1 top-1/2 z-10 -translate-y-1/2"
                      data-page-composer-no-drag="true"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label="About the Media tab"
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            type="button"
                          >
                            <InfoIcon aria-hidden className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px] text-xs leading-snug" side="bottom">
                          Slot-based media for this page: browse the library, upload, or generate images and video into
                          the selected slot.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="relative min-w-0">
                    <TabsTrigger className="w-full pr-7 text-xs sm:text-sm" value="pages">
                      <span className="inline-flex items-center gap-2">
                        <LayoutListIcon className="h-4 w-4 shrink-0" />
                        Pages
                      </span>
                    </TabsTrigger>
                    <div
                      className="pointer-events-auto absolute right-1 top-1/2 z-10 -translate-y-1/2"
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
                          Marketing routes, draft snapshot history, and save or publish actions for the page in the
                          preview.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </TabsList>
              </TooltipProvider>
            </div>
          ) : null}

          <TabsContent className="portal-scroll mt-0 min-h-0 px-5 py-4" value="structure">
            <PageComposerDrawerStructureTab
              draftPage={draftPage}
              duplicateBlock={duplicateBlock}
              handleDragEnd={handleDragEnd}
              heroSummary={heroSummary}
              layoutSectionSummaries={layoutSectionSummaries}
              loading={loading}
              moveBlock={moveBlock}
              openBlockLibrary={openBlockLibrary}
              removeBlock={removeBlock}
              sectionSummaries={sectionSummaries}
              selectedIndex={selectedIndex}
              sensors={sensors as never}
              setSelectedIndex={setSelectedIndex}
              status={status}
              toggleBlockHidden={toggleBlockHidden}
            />
          </TabsContent>

          <TabsContent className="portal-scroll mt-0 min-h-0 px-5 py-4" value="content">
            <PageComposerDrawerContentTab
              detachReusableBlock={detachReusableBlock}
              draftPage={draftPage}
              heroCopy={heroCopy}
              loading={loading}
              mutateSelectedService={mutateSelectedService}
              mutateSelectedServiceGrid={mutateSelectedServiceGrid}
              onOpenMediaSlot={onOpenMediaSlot}
              openBlockLibrary={openBlockLibrary}
              removeBlock={removeBlock}
              resolvedSelectedBlock={resolvedSelectedBlock}
              selectedBlock={selectedBlock}
              selectedHeroBlock={selectedHeroBlock}
              selectedIndex={selectedIndex}
              selectedSummary={selectedSummary}
              status={status}
              updateHeroCopy={updateHeroCopy}
              updateHeroField={updateHeroField}
            />
          </TabsContent>

          <TabsContent className="portal-scroll mt-0 min-h-0 px-5 py-4" value="media">
            <PageComposerDrawerMediaTab
              copilot={copilot ? { openFocusedMediaSession: copilot.openFocusedMediaSession } : null}
              dirty={dirty}
              draftPage={mediaDraftPage}
              loadMediaLibrary={loadMediaLibrary}
              loading={loading}
              mediaActionsLocked={mediaActionsLocked}
              mediaKind={mediaKind}
              mediaLibrary={mediaLibrary}
              mediaLoading={mediaLoading}
              mediaSlots={mediaSlots}
              mediaPrompt={mediaPrompt}
              mediaPromptId={mediaPromptId}
              mediaUploadInputRef={mediaUploadInputRef}
              setMediaKind={setMediaKind}
              setMediaPrompt={setMediaPrompt}
              setSelectedMediaPath={setSelectedMediaPath}
              selectedMediaSlot={_selectedMediaSlot}
              submitMediaAction={submitMediaAction}
              submittingMediaAction={submittingMediaAction}
            />
          </TabsContent>

          <TabsContent className="portal-scroll mt-0 min-h-0 px-5 py-4" value="pages">
            <PageComposerDrawerPagesPanel
              bulkDeleteBusy={bulkDeleteBusy}
              bulkPages={bulkPages}
              bulkVersions={bulkVersions}
              currentPath={currentPath}
              deletingPageId={deletingPageId}
              draftPage={draftPage}
              loading={loading}
              marketingPages={marketingPages}
              onDeletePage={onDeletePage}
              onNavigateToPage={onNavigateToPage}
              pageVersions={pageVersions}
              restoringVersionId={restoringVersionId}
              savingAction={savingAction}
              restorePageVersion={restorePageVersion}
            />
          </TabsContent>

          <PageComposerDrawerFooter
            draftPage={draftPage}
            persistPage={persistPage}
            restoringVersionId={restoringVersionId}
            savingAction={savingAction}
            status={status}
          />
        </Tabs>

        {isBlockLibraryOpen ? (
          <PageComposerDrawerBlockLibrary
            blockLibraryMode={blockLibraryMode}
            blockLibraryQuery={blockLibraryQuery}
            blockLibraryTargetIndex={blockLibraryTargetIndex}
            closeBlockLibrary={closeBlockLibrary}
            filteredBlockDefinitions={filteredBlockDefinitions}
            filteredReusablePresets={filteredReusablePresets}
            insertRegisteredBlock={insertRegisteredBlock}
            insertReusablePreset={insertReusablePreset}
            setBlockLibraryQuery={setBlockLibraryQuery}
          />
        ) : null}
      </div>
    </aside>
  )
}
