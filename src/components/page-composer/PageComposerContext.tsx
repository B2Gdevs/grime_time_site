'use client'

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import type { PageComposerDocument, PageComposerSectionSummary } from '@/lib/pages/pageComposer'
import type {
  CallToActionBlock,
  ContentBlock,
  Media,
  PricingTableBlock,
  ServiceGridBlock,
  TestimonialsSectionBlock,
} from '@/payload-types'

export type PageComposerCanvasMode = 'desktop' | 'mobile' | 'tablet'
export type PageComposerTab = 'content' | 'media' | 'pages' | 'structure'
export type PageComposerVisibilityMode = 'private' | 'public'
export type PageComposerToolbarState = {
  /** True while auto-save or manual save-draft is running. */
  draftToolbarBusy: boolean
  /** Short status next to the spinner when `draftToolbarBusy` (e.g. "Saving…"). */
  draftToolbarStatusLabel: null | string
  dirty: boolean
  draftPage: null | PageComposerDocument
  loading: boolean
  onAddAbove: (index: number) => void
  onAddBelow: (index: number) => void
  /** Revert canvas + field drafts to the last saved snapshot (same as last successful save/load). */
  onResetDraft: () => void
  canResetDraft: boolean
  onDeleteBlock: (index: number) => void
  onDuplicateBlock: (index: number) => void
  /** Stage a slot media change in the current draft so autosave can persist it without blocking editing. */
  onStageMediaSlot: (media: Media, relationPath: string) => void
  onOpenMediaSlot: (relationPath: string) => void
  onSetSlugDraft: (value: string) => void
  onSetTitleDraft: (value: string) => void
  onSetVisibilityDraft: (value: PageComposerVisibilityMode) => void
  onToggleHidden: (index: number) => void
  sectionSummaries: PageComposerSectionSummary[]
  selectedIndex: number
  selectedMediaRelationPath: null | string
  heroEditor:
    | null
    | ({
        blockIndex: number
        copy: string
        fieldPathPrefix: string
        kind: 'marketing-home'
        mediaRelationPath: string
        eyebrow: string
        headlineAccent: string
        headlinePrimary: string
        panelBody: string
        panelEyebrow: string
        panelHeading: string
        updateField: (
          field:
            | 'eyebrow'
            | 'headlineAccent'
            | 'headlinePrimary'
            | 'panelBody'
            | 'panelEyebrow'
            | 'panelHeading',
          value: string,
        ) => void
        updateCopy: (value: string) => void
      })
    | ({
        blockIndex: number
        copy: string
        copyFieldPath: string
        fieldPathPrefix: string
        kind: 'rich-text'
        mediaRelationPath: string
        updateCopy: (value: string) => void
      })
  pricingTableEditor: null | {
    block: PricingTableBlock
    updateBlockField: (field: 'heading', value: string) => void
    updateFeatureText: (featureIndex: number, planIndex: number, value: string) => void
    updatePlanField: (
      field: 'name' | 'price' | 'priceNote' | 'tagline',
      planIndex: number,
      value: string,
    ) => void
    updatePlanLinkLabel: (planIndex: number, value: string) => void
  }
  serviceGridEditor: null | {
    addServiceLane: () => void
    block: ServiceGridBlock
    updateBlockField: (field: 'eyebrow' | 'heading' | 'intro', value: string) => void
    updateHighlightText: (highlightIndex: number, rowIndex: number, value: string) => void
    updateServiceField: (
      field: 'eyebrow' | 'name' | 'pricingHint' | 'summary',
      rowIndex: number,
      value: string,
    ) => void
  }
  ctaEditor: null | {
    block: CallToActionBlock
    updateCopy: (value: string) => void
    updateLinkLabel: (linkIndex: number, value: string) => void
  }
  contentBlockEditor: null | {
    block: ContentBlock
    updateColumnCopy: (columnIndex: number, value: string) => void
    updateColumnLinkLabel: (columnIndex: number, value: string) => void
  }
  testimonialsEditor: null | {
    block: TestimonialsSectionBlock
    updateHeading: (value: string) => void
    updateIntro: (value: string) => void
  }
  slugDraft: string
  titleDraft: string
  visibilityDraft: PageComposerVisibilityMode
  /** Draft-only pages with a persisted id can be deleted; published pages are blocked. */
  canDeleteDraftPage: boolean
  deleteDraftPageBusy: boolean
  onDeleteDraftPage: () => void
}

type PageComposerContextValue = {
  activeTab: PageComposerTab
  activePagePath: null | string
  close: () => void
  /** When the composer session is open but the drawer is collapsed to a launcher strip (full page visible). */
  isPanelMinimized: boolean
  isOpen: boolean
  open: () => void
  previewMode: PageComposerCanvasMode
  selectedIndex: number
  setActivePagePath: (value: null | string) => void
  setActiveTab: (value: PageComposerTab) => void
  setOpen: (value: boolean) => void
  setPanelMinimized: (value: boolean) => void
  setPreviewMode: (value: PageComposerCanvasMode) => void
  setSelectedIndex: (value: number) => void
  toggle: () => void
}

const PageComposerContext = createContext<null | PageComposerContextValue>(null)
export const PAGE_COMPOSER_TOOLBAR_EVENT = 'page-composer-toolbar-change'

export function PageComposerProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<PageComposerTab>('content')
  const [activePagePath, setActivePagePath] = useState<null | string>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isPanelMinimized, setPanelMinimized] = useState(false)
  const [previewMode, setPreviewMode] = useState<PageComposerCanvasMode>('desktop')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const open = useCallback(() => {
    setIsOpen(true)
    setPanelMinimized(false)
  }, [])
  const close = useCallback(() => {
    setIsOpen(false)
    setActivePagePath(null)
    setPanelMinimized(false)
  }, [])
  const toggle = useCallback(() => setIsOpen((current) => !current), [])

  const value = useMemo(
    () => ({
      activeTab,
      activePagePath,
      close,
      isPanelMinimized,
      isOpen,
      open,
      previewMode,
      selectedIndex,
      setActivePagePath,
      setActiveTab,
      setOpen: setIsOpen,
      setPanelMinimized,
      setPreviewMode,
      setSelectedIndex,
      toggle,
    }),
    [activePagePath, activeTab, close, isOpen, isPanelMinimized, open, previewMode, selectedIndex, toggle],
  )

  return <PageComposerContext.Provider value={value}>{children}</PageComposerContext.Provider>
}

export function usePageComposer() {
  const value = useContext(PageComposerContext)

  if (!value) {
    throw new Error('usePageComposer must be used within PageComposerProvider')
  }

  return value
}

export function usePageComposerOptional() {
  return useContext(PageComposerContext)
}
