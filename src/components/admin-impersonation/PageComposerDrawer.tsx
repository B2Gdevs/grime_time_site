'use client'

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { usePathname, useRouter } from 'next/navigation'

import {
  PAGE_COMPOSER_TOOLBAR_EVENT,
  usePageComposerOptional,
  type PageComposerTab,
  type PageComposerToolbarState,
} from '@/components/admin-impersonation/PageComposerContext'
import { usePortalCopilotOptional } from '@/components/copilot/PortalCopilotContext'
import { buildMediaDevtoolsSummary } from '@/lib/media/pageMediaDevtools'
import {
  buildPageComposerValidationSummary,
  buildPageComposerSectionSummaries,
  countPageComposerChangedBlocks,
  duplicatePageLayoutSection,
  filterMarketingComposerPageSummaries,
  insertPageLayoutRegisteredBlock,
  normalizeComposerRoutePath,
  removePageLayoutSection,
  togglePageLayoutSectionHidden,
  type PageComposerDocument,
  type PageComposerPageSummary,
  type PageComposerSectionSummary,
  type PageComposerVersionSummary,
  updatePageLayoutSection,
} from '@/lib/pages/pageComposer'
import { createLexicalParagraph, lexicalToPlainText } from '@/lib/pages/pageComposerLexical'
import {
  createPageComposerBlock,
  getPageComposerBlockDefinitions,
  type PageComposerInsertableBlockType,
} from '@/lib/pages/pageComposerBlockRegistry'
import {
  createReusablePresetBlock,
  createSharedSectionLinkedBlock,
  getPageComposerReusablePresets,
  linkedSharedSectionId,
  isLinkedSharedSectionBlock,
  resolvePageComposerReusableBlock,
  type ReusableAwareLayoutBlock,
} from '@/lib/pages/pageComposerReusableBlocks'
import type { SharedSectionRecord } from '@/lib/pages/sharedSections'
import type {
  CallToActionBlock,
  ContentBlock,
  Media,
  ServiceGridBlock,
  TestimonialsSectionBlock,
} from '@/payload-types'
import { formatComposerTimestamp } from '@/utilities/formatComposerTimestamp'
import { parseResponseJson } from '@/utilities/parseResponseJson'

import { PageComposerDrawerShell } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerShell'
import { PhraseConfirmDialog } from '@/components/admin-impersonation/PhraseConfirmDialog'
import { TypePathConfirmDialog } from '@/components/admin-impersonation/TypePathConfirmDialog'
import {
  type BlockLibraryMode,
  type MediaAction,
  type MediaLibraryItem,
  type PageComposerResponse,
  type PricingPlan,
  type SavingAction,
  type SectionMediaSlot,
  type ServiceGridService,
} from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerTypes'
import {
  asMedia,
  createServiceGridLaneDraft,
  getFileKind,
} from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerUtils'

function stagePageComposerMediaSlot(args: {
  media: Media
  page: PageComposerDocument
  relationPath: string
}): PageComposerDocument {
  const { media, page, relationPath } = args

  if (relationPath === 'hero.media') {
    return {
      ...page,
      hero: {
        ...page.hero,
        media,
      },
    }
  }

  const layoutMediaMatch = /^layout\.(\d+)\.media$/.exec(relationPath)
  if (layoutMediaMatch) {
    const blockIndex = Number(layoutMediaMatch[1])
    const layout = [...(page.layout || [])]
    const target = layout[blockIndex]

    if (!target || target.blockType !== 'mediaBlock') {
      return page
    }

    layout[blockIndex] = {
      ...target,
      media,
    }

    return {
      ...page,
      layout,
    }
  }

  const serviceMediaMatch = /^layout\.(\d+)\.services\.(\d+)\.media$/.exec(relationPath)
  if (serviceMediaMatch) {
    const blockIndex = Number(serviceMediaMatch[1])
    const serviceIndex = Number(serviceMediaMatch[2])
    const layout = [...(page.layout || [])]
    const target = layout[blockIndex]

    if (!target || target.blockType !== 'serviceGrid' || !target.services?.[serviceIndex]) {
      return page
    }

    const services = [...target.services]
    services[serviceIndex] = {
      ...services[serviceIndex],
      media,
    }

    layout[blockIndex] = {
      ...target,
      services,
    }

    return {
      ...page,
      layout,
    }
  }

  return page
}

function resolveSelectedIndexFromMediaRelationPath(relationPath: string): null | number {
  if (relationPath === 'hero.media') {
    return -1
  }

  const layoutMediaMatch = /^layout\.(\d+)\./.exec(relationPath)
  if (!layoutMediaMatch) {
    return null
  }

  return Number(layoutMediaMatch[1])
}

/** Resolve a media slot from the page draft alone so targeting works before `selectedIndex` catches up with the canvas. */
function resolveMediaSlotFromRelationPath(
  draftPage: PageComposerDocument,
  relationPath: string,
  sectionSummaries: PageComposerSectionSummary[],
): SectionMediaSlot | null {
  if (relationPath === 'hero.media') {
    const media = buildMediaDevtoolsSummary(asMedia(draftPage.hero?.media))
    return {
      label: 'Hero image',
      media,
      mediaId: media?.id || null,
      mimeType: media?.mimeType || null,
      relationPath: 'hero.media',
    }
  }

  const layoutOnly = /^layout\.(\d+)\.media$/.exec(relationPath)
  if (layoutOnly) {
    const blockIndex = Number(layoutOnly[1])
    const block = draftPage.layout?.[blockIndex]
    if (!block || block.blockType !== 'mediaBlock') {
      return null
    }
    const sectionSummary = sectionSummaries.find((summary) => summary.index === blockIndex)
    const media = buildMediaDevtoolsSummary(asMedia(block.media))
    return {
      label: sectionSummary?.label || block.blockName || 'Section media',
      media,
      mediaId: media?.id || null,
      mimeType: media?.mimeType || null,
      relationPath,
    }
  }

  const servicePath = /^layout\.(\d+)\.services\.(\d+)\.media$/.exec(relationPath)
  if (servicePath) {
    const blockIndex = Number(servicePath[1])
    const serviceIndex = Number(servicePath[2])
    const block = draftPage.layout?.[blockIndex]
    if (!block || block.blockType !== 'serviceGrid') {
      return null
    }
    const service = block.services?.[serviceIndex]
    if (!service) {
      return null
    }
    const media = buildMediaDevtoolsSummary(asMedia(service.media))
    return {
      label: service.name || `Row ${serviceIndex + 1}`,
      media,
      mediaId: media?.id || null,
      mimeType: media?.mimeType || null,
      relationPath,
    }
  }

  return null
}

export function PageComposerDrawer({
  embedded = false,
  enabled,
  onRequestClose,
}: {
  embedded?: boolean
  enabled: boolean
  onRequestClose?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const composer = usePageComposerOptional()
  const copilot = usePortalCopilotOptional()
  const setCopilotAuthoringContext = copilot?.setAuthoringContext
  const composerActivePagePath = composer?.activePagePath
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const [blockLibraryQuery, setBlockLibraryQuery] = useState('')
  const [blockLibraryMode, setBlockLibraryMode] = useState<BlockLibraryMode>('insert')
  const [blockLibraryTargetIndex, setBlockLibraryTargetIndex] = useState<null | number>(null)
  const [draftPage, setDraftPage] = useState<null | PageComposerDocument>(null)
  const [isBlockLibraryOpen, setIsBlockLibraryOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mediaKind, setMediaKind] = useState<'image' | 'video'>('image')
  const [mediaLibrary, setMediaLibrary] = useState<MediaLibraryItem[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaPrompt, setMediaPrompt] = useState('')
  const [selectedMediaPath, setSelectedMediaPath] = useState<null | string>(null)
  const [, setMediaStatus] = useState<null | string>(null)
  const [marketingPages, setMarketingPages] = useState<PageComposerPageSummary[]>([])
  const [pageVersions, setPageVersions] = useState<PageComposerVersionSummary[]>([])
  const [restoringVersionId, setRestoringVersionId] = useState<null | string>(null)
  const [submittingMediaAction, setSubmittingMediaAction] = useState<null | MediaAction>(null)
  const [savingAction, setSavingAction] = useState<null | SavingAction>(null)
  const [deleteDraftInFlight, setDeleteDraftInFlight] = useState(false)
  const [deletingPageId, setDeletingPageId] = useState<null | number>(null)
  const [pendingDeletePage, setPendingDeletePage] = useState<null | {
    isPublished: boolean
    pageId: number
    pagePath: string
    title: string
  }>(null)
  const [selectedMarketingPageIds, setSelectedMarketingPageIds] = useState<number[]>([])
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([])
  const [bulkPhraseTarget, setBulkPhraseTarget] = useState<null | 'pages' | 'versions'>(null)
  const [bulkPhraseBusy, setBulkPhraseBusy] = useState(false)
  const [savedPage, setSavedPage] = useState<null | PageComposerDocument>(null)
  const [sharedSections, setSharedSections] = useState<SharedSectionRecord[]>([])
  const [sharedSectionsLoading, setSharedSectionsLoading] = useState(false)
  const [sharedSectionsStatus, setSharedSectionsStatus] = useState<null | string>(null)
  const [status, setStatus] = useState<null | string>(null)
  const [titleDraft, setTitleDraft] = useState('')
  const [slugDraft, setSlugDraft] = useState('')
  const [visibilityDraft, setVisibilityDraft] = useState<'private' | 'public'>('public')
  const [dirty, setDirty] = useState(false)
  const mediaUploadInputRef = useRef<HTMLInputElement | null>(null)
  const mediaPromptId = useId()
  const open = composer?.isOpen ?? false
  const activeTab = composer?.activeTab ?? 'content'
  const selectedIndex = composer?.selectedIndex ?? 0

  const setSelectedIndex = useCallback(
    (value: number) => {
      composer?.setSelectedIndex(value)
    },
    [composer],
  )
  const setActiveTab = useCallback(
    (value: PageComposerTab) => {
      composer?.setActiveTab(value)
    },
    [composer],
  )

  const sharedSectionsById = useMemo(
    () => new Map(sharedSections.map((item) => [item.id, item])),
    [sharedSections],
  )
  const sectionSummaries = useMemo(() => {
    const layoutSummaries = buildPageComposerSectionSummaries(draftPage?.layout, sharedSectionsById)

    if (!draftPage) {
      return layoutSummaries
    }

    return [
      {
        badges: ['page'],
        blockType: 'hero' as const,
        category: 'static' as const,
        description: draftPage.hero?.media ? 'Hero copy and media' : 'Hero copy with fallback media state',
        hidden: false,
        index: -1,
        label: 'Hero',
        variant: draftPage.hero?.type || null,
      },
      ...layoutSummaries,
    ]
  }, [draftPage, sharedSectionsById])
  const blockDefinitions = useMemo(() => getPageComposerBlockDefinitions(), [])
  const reusablePresets = useMemo(() => getPageComposerReusablePresets(), [])
  const filteredBlockDefinitions = useMemo(() => {
    const query = blockLibraryQuery.trim().toLowerCase()

    if (!query) {
      return blockDefinitions
    }

    return blockDefinitions.filter((definition) =>
      [definition.label, definition.description, ...definition.keywords].some((value) =>
        value.toLowerCase().includes(query),
      ),
    )
  }, [blockDefinitions, blockLibraryQuery])
  const filteredReusablePresets = useMemo(() => {
    const query = blockLibraryQuery.trim().toLowerCase()

    return reusablePresets.filter((preset) => {
      if (!query) return true
      return [preset.label, preset.description, preset.key, preset.blockType].some((value) =>
        value.toLowerCase().includes(query),
      )
    })
  }, [blockLibraryQuery, reusablePresets])
  const filteredSharedSections = useMemo(() => {
    const query = blockLibraryQuery.trim().toLowerCase()

    return sharedSections.filter((item) => {
      if (!query) return true
      return [item.name, item.description || '', item.slug, item.category, ...item.tags].some((value) =>
        value.toLowerCase().includes(query),
      )
    })
  }, [blockLibraryQuery, sharedSections])
  const selectedBlock = draftPage?.layout?.[selectedIndex] || null
  const selectedSummary = sectionSummaries.find((summary) => summary.index === selectedIndex) || null
  const resolvedSelectedBlock = selectedBlock
    ? resolvePageComposerReusableBlock(selectedBlock, { sharedSectionsById })
    : null
  const selectedServiceGrid =
    resolvedSelectedBlock?.blockType === 'serviceGrid'
      ? (resolvedSelectedBlock as ServiceGridBlock)
      : null
  const selectedPricingTable =
    resolvedSelectedBlock?.blockType === 'pricingTable'
      ? resolvedSelectedBlock
      : null
  const selectedCallToAction =
    resolvedSelectedBlock?.blockType === 'cta'
      ? (resolvedSelectedBlock as CallToActionBlock)
      : null
  const selectedContentBlock =
    resolvedSelectedBlock?.blockType === 'content'
      ? (resolvedSelectedBlock as ContentBlock)
      : null
  const selectedTestimonialsBlock =
    resolvedSelectedBlock?.blockType === 'testimonialsBlock'
      ? (resolvedSelectedBlock as TestimonialsSectionBlock)
      : null
  const heroCopy = lexicalToPlainText(draftPage?.hero?.richText)
  const selectedSharedSectionId = linkedSharedSectionId(selectedBlock)
  const selectedBlockIsLinkedSharedSection = isLinkedSharedSectionBlock(selectedBlock)
  const mediaSlots = useMemo<SectionMediaSlot[]>(() => {
    if (!draftPage) {
      return []
    }

    if (selectedIndex === -1) {
      const media = buildMediaDevtoolsSummary(asMedia(draftPage.hero?.media))
      return [
        {
          label: 'Hero image',
          media,
          mediaId: media?.id || null,
          mimeType: media?.mimeType || null,
          relationPath: 'hero.media',
        },
      ]
    }

    if (resolvedSelectedBlock?.blockType === 'mediaBlock') {
      const media = buildMediaDevtoolsSummary(asMedia(resolvedSelectedBlock.media))
      return [
        {
          label: selectedSummary?.label || resolvedSelectedBlock.blockName || 'Section media',
          media,
          mediaId: media?.id || null,
          mimeType: media?.mimeType || null,
          relationPath: `layout.${selectedIndex}.media`,
        },
      ]
    }

    if (!selectedServiceGrid) {
      return []
    }

    return (selectedServiceGrid.services || []).map((service, serviceIndex) => {
      const media = buildMediaDevtoolsSummary(asMedia(service.media))
      return {
        label: service.name || `Row ${serviceIndex + 1}`,
        media,
        mediaId: media?.id || null,
        mimeType: media?.mimeType || null,
        relationPath: `layout.${selectedIndex}.services.${serviceIndex}.media`,
      }
    })
  }, [draftPage, resolvedSelectedBlock, selectedIndex, selectedServiceGrid, selectedSummary?.label])
  const selectedMediaSlot = useMemo(() => {
    if (selectedMediaPath === null || !draftPage) {
      return null
    }
    const fromSlots = mediaSlots.find((slot) => slot.relationPath === selectedMediaPath)
    if (fromSlots) {
      return fromSlots
    }
    return resolveMediaSlotFromRelationPath(draftPage, selectedMediaPath, sectionSummaries)
  }, [draftPage, mediaSlots, sectionSummaries, selectedMediaPath])
  const mediaActionsLocked = dirty || !draftPage || typeof draftPage.id !== 'number'
  const heroSummary = sectionSummaries.find((summary) => summary.index === -1) || null
  const layoutSectionSummaries = sectionSummaries.filter((summary) => summary.index >= 0)
  const _changedBlockCount = useMemo(
    () =>
      countPageComposerChangedBlocks({
        baselineLayout: savedPage?.layout,
        draftLayout: draftPage?.layout,
      }),
    [draftPage?.layout, savedPage?.layout],
  )
  const _validationSummary = useMemo(
    () =>
      draftPage
        ? buildPageComposerValidationSummary({
            page: {
              ...draftPage,
              slug: slugDraft,
              title: titleDraft,
              visibility: visibilityDraft,
            },
            sharedSectionsById,
          })
        : null,
    [draftPage, sharedSectionsById, slugDraft, titleDraft, visibilityDraft],
  )

  useEffect(() => {
    if (selectedMediaPath === null || !draftPage) {
      return
    }
    if (
      resolveMediaSlotFromRelationPath(draftPage, selectedMediaPath, sectionSummaries) === null
    ) {
      setSelectedMediaPath(null)
    }
  }, [draftPage, sectionSummaries, selectedMediaPath])


  useEffect(() => {
    if (!sectionSummaries.length) {
      setSelectedIndex(0)
      return
    }

    if (!sectionSummaries.some((summary) => summary.index === selectedIndex)) {
      setSelectedIndex(sectionSummaries[0]?.index ?? 0)
    }
  }, [sectionSummaries, selectedIndex, setSelectedIndex])

  useEffect(() => {
    if (!composer) {
      return
    }

    if (!open) {
      composer.setActivePagePath(null)
      return
    }

    composer.setActivePagePath(draftPage?.pagePath || pathname)
  }, [composer, draftPage?.pagePath, open, pathname])

  useEffect(() => {
    if (!setCopilotAuthoringContext || !draftPage) {
      return
    }

    if (activeTab === 'media') {
      return
    }

    setCopilotAuthoringContext({
      libraryMedia: null,
      mediaSlot: !selectedMediaSlot
        ? null
        : {
            label: selectedMediaSlot.label,
            mediaId: selectedMediaSlot.mediaId,
            mimeType: selectedMediaSlot.mimeType,
            relationPath: selectedMediaSlot.relationPath,
          },
      page: {
        id: draftPage.id,
        pagePath: draftPage.pagePath,
        slug: draftPage.slug,
        status: draftPage._status === 'published' ? 'published' : 'draft',
        title: draftPage.title,
        visibility: draftPage.visibility === 'private' ? 'private' : 'public',
      },
      section: selectedSummary
        ? {
            blockType: selectedSummary.blockType,
            description: selectedSummary.description,
            index: selectedSummary.index,
            label: selectedSummary.label,
            variant: selectedSummary.variant,
          }
        : null,
      surface: 'page-composer',
    })
  }, [activeTab, draftPage, selectedMediaSlot, selectedSummary, setCopilotAuthoringContext])

  const loadPage = useCallback(
    async (args?: { pageId?: number; pagePath?: string }) => {
      if (!enabled) return

      const requestedPath = args?.pagePath || composer?.activePagePath || pathname || '/'
      const query = args?.pageId
        ? `pageId=${args.pageId}`
        : `pagePath=${encodeURIComponent(requestedPath)}`

      setLoading(true)
      setStatus(null)

      try {
        const response = await fetch(`/api/internal/page-composer?${query}`)
        const payload = await parseResponseJson<null | PageComposerResponse>(response)

        if (!response.ok || !payload?.page) {
          throw new Error(payload?.error || 'Unable to load the page composer.')
        }

        setDraftPage(payload.page)
        setPageVersions(payload.versions || [])
        setMarketingPages(filterMarketingComposerPageSummaries(payload.pages ?? []))
        setSavedPage(payload.page)
        setTitleDraft(payload.page.title || '')
        setSlugDraft(payload.page.slug || '')
        setVisibilityDraft(payload.page.visibility === 'private' ? 'private' : 'public')
        setDirty(false)
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Unable to load the page composer.')
      } finally {
        setLoading(false)
      }
    },
    [composer?.activePagePath, enabled, pathname],
  )

  const navigateComposerToPage = useCallback(
    (pagePath: string) => {
      composer?.setActivePagePath(pagePath)
      router.push(pagePath)
      void loadPage({ pagePath })
    },
    [composer, loadPage, router],
  )

  const requestDeletePageFromIndex = useCallback(
    (args: { isPublished: boolean; pageId: number; pagePath: string; title: string }) => {
      setPendingDeletePage(args)
    },
    [],
  )

  const runDeletePageFromIndex = useCallback(
    async (args: { isPublished: boolean; pageId: number; pagePath: string; title: string }) => {
      const label = args.title.trim() || args.pagePath

      setDeletingPageId(args.pageId)
      setStatus(null)
      try {
        const response = await fetch('/api/internal/page-composer', {
          body: JSON.stringify({ action: 'delete-page', pageId: args.pageId }),
          headers: { 'content-type': 'application/json' },
          method: 'POST',
        })
        const payload = await parseResponseJson<null | PageComposerResponse>(response)
        if (!response.ok) throw new Error(payload?.error || 'Unable to delete the page.')
        if (payload?.pages) {
          setMarketingPages(filterMarketingComposerPageSummaries(payload.pages))
        }
        setStatus(`Deleted ${label}.`)
        const deletedPath = normalizeComposerRoutePath(args.pagePath)
        const current = normalizeComposerRoutePath(pathname)
        if (deletedPath === current) {
          composer?.setActivePagePath('/')
          router.push('/')
          await loadPage({ pagePath: '/' })
        }
        router.refresh()
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Unable to delete the page.')
      } finally {
        setDeletingPageId(null)
      }
    },
    [composer, loadPage, pathname, router],
  )

  const runBulkDeletePages = useCallback(async () => {
    const ids = [...selectedMarketingPageIds]
    if (ids.length === 0) {
      return
    }

    setStatus(null)
    try {
      const response = await fetch('/api/internal/page-composer', {
        body: JSON.stringify({ action: 'bulk-delete-pages', pageIds: ids }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      const payload = await parseResponseJson<null | PageComposerResponse>(response)
      if (!response.ok) throw new Error(payload?.error || 'Unable to delete pages.')
      if (payload?.pages) {
        setMarketingPages(filterMarketingComposerPageSummaries(payload.pages))
      }
      const paths = marketingPages
        .filter((p) => typeof p.id === 'number' && ids.includes(p.id))
        .map((p) => p.pagePath)
      const current = normalizeComposerRoutePath(pathname)
      if (paths.some((path) => normalizeComposerRoutePath(path) === current)) {
        composer?.setActivePagePath('/')
        router.push('/')
        await loadPage({ pagePath: '/' })
      }
      setSelectedMarketingPageIds([])
      setStatus(`Deleted ${ids.length} page(s).`)
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to delete pages.')
    }
  }, [composer, loadPage, marketingPages, pathname, router, selectedMarketingPageIds])

  const runBulkDeleteVersions = useCallback(async () => {
    const versionIds = [...selectedVersionIds]
    if (!draftPage || typeof draftPage.id !== 'number' || versionIds.length === 0) {
      return
    }

    setStatus(null)
    try {
      const response = await fetch('/api/internal/page-composer', {
        body: JSON.stringify({
          action: 'bulk-delete-page-versions',
          pageId: draftPage.id,
          versionIds,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      const payload = await parseResponseJson<null | PageComposerResponse>(response)
      if (!response.ok) throw new Error(payload?.error || 'Unable to delete draft snapshots.')
      if (payload?.versions) {
        setPageVersions(payload.versions)
      }
      setSelectedVersionIds([])
      setStatus(`Deleted ${versionIds.length} snapshot(s).`)
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to delete draft snapshots.')
    }
  }, [draftPage, router, selectedVersionIds])

  const toggleMarketingPageSelect = useCallback((pageId: number) => {
    setSelectedMarketingPageIds((prev) =>
      prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId],
    )
  }, [])

  const selectAllMarketingPages = useCallback(() => {
    const all = marketingPages
      .map((p) => p.id)
      .filter((id): id is number => typeof id === 'number')
    setSelectedMarketingPageIds(all)
  }, [marketingPages])

  const clearMarketingSelection = useCallback(() => setSelectedMarketingPageIds([]), [])

  const requestBulkDeleteMarketingPages = useCallback(() => {
    if (selectedMarketingPageIds.length === 0) {
      return
    }
    setBulkPhraseTarget('pages')
  }, [selectedMarketingPageIds.length])

  const toggleVersionSelect = useCallback((versionId: string) => {
    setSelectedVersionIds((prev) =>
      prev.includes(versionId) ? prev.filter((id) => id !== versionId) : [...prev, versionId],
    )
  }, [])

  const selectAllDeletableVersions = useCallback(() => {
    const ids = pageVersions.filter((v) => !v.latest).map((v) => v.id)
    setSelectedVersionIds(ids)
  }, [pageVersions])

  const clearVersionSelection = useCallback(() => setSelectedVersionIds([]), [])

  const requestBulkDeleteVersions = useCallback(() => {
    if (selectedVersionIds.length === 0) {
      return
    }
    setBulkPhraseTarget('versions')
  }, [selectedVersionIds.length])

  useEffect(() => {
    setSelectedMarketingPageIds((prev) =>
      prev.filter((id) => marketingPages.some((p) => p.id === id)),
    )
  }, [marketingPages])

  useEffect(() => {
    setSelectedVersionIds((prev) => prev.filter((id) => pageVersions.some((v) => v.id === id)))
  }, [pageVersions])

  const loadMediaLibrary = useCallback(async () => {
    if (!enabled || !open) return
    setMediaLoading(true)
    setMediaStatus(null)
    try {
      const response = await fetch('/api/internal/page-composer/media')
      const payload = await parseResponseJson<null | { error?: string; items?: MediaLibraryItem[] }>(response)
      if (!response.ok) throw new Error(payload?.error || 'Unable to load media records.')
      setMediaLibrary(payload?.items || [])
    } catch (error) {
      setMediaStatus(error instanceof Error ? error.message : 'Unable to load media records.')
    } finally {
      setMediaLoading(false)
    }
  }, [enabled, open])

  const loadSharedSectionLibrary = useCallback(async () => {
    if (!enabled || !open) return
    setSharedSectionsLoading(true)
    setSharedSectionsStatus(null)
    try {
      const response = await fetch('/api/internal/shared-sections?status=published')
      const payload = await parseResponseJson<null | { error?: string; items?: SharedSectionRecord[] }>(response)
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to load shared sections.')
      }
      setSharedSections(payload?.items || [])
    } catch (error) {
      setSharedSectionsStatus(error instanceof Error ? error.message : 'Unable to load shared sections.')
    } finally {
      setSharedSectionsLoading(false)
    }
  }, [enabled, open])

  useEffect(() => {
    if (!open) return
    void loadPage()
    void loadMediaLibrary()
    void loadSharedSectionLibrary()
  }, [loadMediaLibrary, loadPage, loadSharedSectionLibrary, open])

  useEffect(() => {
    if (open) return
    setIsBlockLibraryOpen(false)
    setBlockLibraryMode('insert')
    setBlockLibraryTargetIndex(null)
    setBlockLibraryQuery('')
  }, [open])

  function mutatePage(mutator: (page: PageComposerDocument) => PageComposerDocument) {
    setDraftPage((current) => {
      if (!current) return current
      setDirty(true)
      return mutator(current)
    })
  }

  const stageMediaSlot = useCallback((media: Media, relationPath: string) => {
    setDraftPage((current) => {
      if (!current) {
        return current
      }

      setDirty(true)
      return stagePageComposerMediaSlot({
        media,
        page: current,
        relationPath,
      })
    })
  }, [])

  const replaceSelectedBlock = useCallback((block: NonNullable<PageComposerDocument['layout']>[number]) => {
    mutatePage((page) => ({
      ...page,
      layout: updatePageLayoutSection({ block, index: selectedIndex, layout: page.layout || [] }),
    }))
  }, [selectedIndex])

  const mutateSelectedServiceGrid = useCallback((mutator: (block: ServiceGridBlock) => ServiceGridBlock) => {
    if (!selectedServiceGrid) return
    replaceSelectedBlock(mutator(selectedServiceGrid))
  }, [replaceSelectedBlock, selectedServiceGrid])

  const mutateSelectedService = useCallback((serviceIndex: number, mutator: (service: ServiceGridService) => ServiceGridService) => {
    mutateSelectedServiceGrid((block) => {
      const services = [...(block.services || [])]
      const current = services[serviceIndex]
      if (!current) return block
      services[serviceIndex] = mutator(current)
      return { ...block, services }
    })
  }, [mutateSelectedServiceGrid])

  const mutateSelectedPricingTable = useCallback((mutator: (block: NonNullable<typeof selectedPricingTable>) => NonNullable<typeof selectedPricingTable>) => {
    if (!selectedPricingTable) return
    replaceSelectedBlock(mutator(selectedPricingTable))
  }, [replaceSelectedBlock, selectedPricingTable])
  const mutateSelectedCallToAction = useCallback((mutator: (block: NonNullable<typeof selectedCallToAction>) => NonNullable<typeof selectedCallToAction>) => {
    if (!selectedCallToAction) return
    replaceSelectedBlock(mutator(selectedCallToAction))
  }, [replaceSelectedBlock, selectedCallToAction])
  const mutateSelectedContentBlock = useCallback((mutator: (block: NonNullable<typeof selectedContentBlock>) => NonNullable<typeof selectedContentBlock>) => {
    if (!selectedContentBlock) return
    replaceSelectedBlock(mutator(selectedContentBlock))
  }, [replaceSelectedBlock, selectedContentBlock])
  const mutateSelectedTestimonialsBlock = useCallback((mutator: (block: NonNullable<typeof selectedTestimonialsBlock>) => NonNullable<typeof selectedTestimonialsBlock>) => {
    if (!selectedTestimonialsBlock) return
    replaceSelectedBlock(mutator(selectedTestimonialsBlock))
  }, [replaceSelectedBlock, selectedTestimonialsBlock])

  const mutateSelectedPricingPlan = useCallback((planIndex: number, mutator: (plan: PricingPlan) => PricingPlan) => {
    mutateSelectedPricingTable((block) => {
      const plans = [...(block.inlinePlans || [])]
      const current = plans[planIndex]
      if (!current) return block
      plans[planIndex] = mutator(current)
      return { ...block, inlinePlans: plans }
    })
  }, [mutateSelectedPricingTable])

  function handleDragEnd(event: DragEndEvent) {
    const activeId = Number(event.active.id)
    const overId = Number(event.over?.id)
    if (!Number.isInteger(activeId) || !Number.isInteger(overId) || activeId === overId) return
    mutatePage((page) => ({ ...page, layout: arrayMove(page.layout || [], activeId, overId) }))
    setSelectedIndex(overId)
  }

  function openBlockLibrary(index: number, mode: BlockLibraryMode = 'insert') {
    setBlockLibraryMode(mode)
    setBlockLibraryTargetIndex(Math.max(0, index))
    setBlockLibraryQuery('')
    setIsBlockLibraryOpen(true)
  }

  const closeBlockLibrary = useCallback(() => {
    setIsBlockLibraryOpen(false)
    setBlockLibraryTargetIndex(null)
  }, [])

  function applyBlockLibrarySelection(nextBlock: NonNullable<PageComposerDocument['layout']>[number]) {
    if (blockLibraryTargetIndex === null) {
      return
    }

    if (blockLibraryMode === 'replace') {
      updateBlockAtIndex(blockLibraryTargetIndex, nextBlock)
    } else {
      mutatePage((page) => ({
        ...page,
        layout: insertPageLayoutRegisteredBlock({
          index: blockLibraryTargetIndex,
          layout: page.layout || [],
          type: nextBlock.blockType as PageComposerInsertableBlockType,
        }).map((block, index) => (index === blockLibraryTargetIndex ? nextBlock : block)),
      }))
      setSelectedIndex(blockLibraryTargetIndex)
    }

    setIsBlockLibraryOpen(false)
    setBlockLibraryMode('insert')
    setBlockLibraryTargetIndex(null)
    setActiveTab('content')
  }

  function insertRegisteredBlock(type: PageComposerInsertableBlockType) {
    applyBlockLibrarySelection(createPageComposerBlock(type))
  }

  function openSharedSectionSourceEditor(sharedSectionId: number) {
    composer?.close()
    router.push(`/shared-sections/${sharedSectionId}/edit`)
  }

  const persistPage = useCallback(
    async (action: SavingAction) => {
      if (!draftPage) return
      setSavingAction(action)
      setStatus(null)
      const priorId = draftPage.id
      try {
        const response = await fetch('/api/internal/page-composer', {
          body: JSON.stringify({
            action,
            layout: draftPage.layout,
            pageId: draftPage.id,
            pagePath: draftPage.pagePath,
            slug: slugDraft.trim(),
            title: titleDraft.trim(),
            visibility: visibilityDraft,
          }),
          headers: { 'content-type': 'application/json' },
          method: 'POST',
        })
        const payload = await parseResponseJson<null | PageComposerResponse>(response)
        if (!response.ok || !payload?.page) throw new Error(payload?.error || 'Unable to save the page.')
        const nextPage =
          action === 'save-draft' && payload.page.pagePath !== pathname
            ? {
                ...payload.page,
                pagePath: pathname,
              }
            : payload.page
        setDraftPage(nextPage)
        setPageVersions(payload.versions || [])
        if (payload.pages) {
          setMarketingPages(filterMarketingComposerPageSummaries(payload.pages))
        }
        setSavedPage(nextPage)
        setTitleDraft(nextPage.title || '')
        setSlugDraft(nextPage.slug || '')
        setVisibilityDraft(nextPage.visibility === 'private' ? 'private' : 'public')
        setDirty(false)
        setStatus(
          action === 'publish-page'
            ? priorId
              ? 'Page published.'
              : 'Page created and published.'
            : priorId
              ? 'Draft saved.'
              : 'Draft created.',
        )
        if (action === 'publish-page' && payload.page.pagePath !== pathname) {
          router.push(payload.page.pagePath)
        }
        router.refresh()
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Unable to save the page.')
      } finally {
        setSavingAction(null)
      }
    },
    [draftPage, pathname, router, slugDraft, titleDraft, visibilityDraft],
  )

  const persistPageRef = useRef(persistPage)
  persistPageRef.current = persistPage

  const resetDraftFromSaved = useCallback(() => {
    if (!savedPage) return
    const cloned = JSON.parse(JSON.stringify(savedPage)) as PageComposerDocument
    setDraftPage(cloned)
    setTitleDraft(savedPage.title || '')
    setSlugDraft(savedPage.slug || '')
    setVisibilityDraft(savedPage.visibility === 'private' ? 'private' : 'public')
    setDirty(false)
    setStatus(null)
  }, [savedPage])

  const AUTO_SAVE_DEBOUNCE_MS = 1200

  useEffect(() => {
    if (!open) return
    if (!dirty) return
    if (!draftPage || typeof draftPage.id !== 'number') return
    if (draftPage._status === 'published') return
    if (savingAction) return

    const timer = window.setTimeout(() => {
      void persistPageRef.current('save-draft')
    }, AUTO_SAVE_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [open, dirty, draftPage, savingAction, titleDraft, slugDraft, visibilityDraft])

  const draftToolbarBusy = savingAction === 'save-draft'
  const draftToolbarStatusLabel = draftToolbarBusy ? 'Saving…' : null
  const canResetDraft = Boolean(dirty && savedPage)

  const restorePageVersion = useCallback(async (version: PageComposerVersionSummary) => {
    if (!draftPage || typeof draftPage.id !== 'number') return

    const confirmed =
      typeof window === 'undefined'
        ? true
        : window.confirm(
            `Restore ${version.title} from ${formatComposerTimestamp(version.updatedAt)} as the current draft? Unsaved page edits will be replaced.`,
          )

    if (!confirmed) {
      return
    }

    setRestoringVersionId(version.id)
    setStatus(null)

    try {
      const response = await fetch('/api/internal/page-composer', {
        body: JSON.stringify({
          action: 'restore-page-version',
          pageId: draftPage.id,
          versionId: version.id,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      const payload = await parseResponseJson<null | PageComposerResponse>(response)

      if (!response.ok || !payload?.page) {
        throw new Error(payload?.error || 'Unable to restore the page version.')
      }

      setDraftPage(payload.page)
      setPageVersions(payload.versions || [])
      setSavedPage(payload.page)
      setTitleDraft(payload.page.title || '')
      setSlugDraft(payload.page.slug || '')
      setVisibilityDraft(payload.page.visibility === 'private' ? 'private' : 'public')
      setDirty(false)
      setStatus(`Restored ${version.title} as the current draft.`)
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to restore the page version.')
    } finally {
      setRestoringVersionId(null)
    }
  }, [draftPage, router])

  const deleteDraftPage = useCallback(async () => {
    if (!draftPage || typeof draftPage.id !== 'number') {
      return
    }

    if (draftPage._status === 'published') {
      return
    }

    setDeleteDraftInFlight(true)
    setStatus(null)

    try {
      const response = await fetch('/api/internal/page-composer', {
        body: JSON.stringify({
          action: 'delete-draft',
          pageId: draftPage.id,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      const payload = await parseResponseJson<{ error?: string }>(response)

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to delete the draft page.')
      }

      composer?.close()
      router.push('/')
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to delete the draft page.')
    } finally {
      setDeleteDraftInFlight(false)
    }
  }, [composer, draftPage, router])

  const duplicateBlock = useCallback((index: number) => {
    mutatePage((page) => ({
      ...page,
      layout: duplicatePageLayoutSection({ index, layout: page.layout || [] }),
    }))
    setSelectedIndex(index + 1)
  }, [setSelectedIndex])

  const removeBlock = useCallback((index: number) => {
    mutatePage((page) => ({
      ...page,
      layout: removePageLayoutSection({ index, layout: page.layout || [] }),
    }))
    setSelectedIndex(Math.max(0, index - 1))
  }, [setSelectedIndex])

  const toggleBlockHidden = useCallback((index: number) => {
    mutatePage((page) => ({
      ...page,
      layout: togglePageLayoutSectionHidden({
        index,
        layout: page.layout || [],
      }),
    }))
    setSelectedIndex(index)
  }, [setSelectedIndex])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const detail: null | PageComposerToolbarState =
      open && draftPage && composerActivePagePath === pathname
        ? {
            canResetDraft,
            dirty,
            draftPage,
            draftToolbarBusy,
            draftToolbarStatusLabel,
            loading,
            onAddAbove: (index) => openBlockLibrary(index < 0 ? 0 : index),
            onAddBelow: (index) => openBlockLibrary(index < 0 ? 0 : index + 1),
            onDeleteBlock: (index) => {
              if (index < 0) return
              removeBlock(index)
            },
            onDuplicateBlock: (index) => {
              if (index < 0) return
              duplicateBlock(index)
            },
            onStageMediaSlot: (media, relationPath) => {
              stageMediaSlot(media, relationPath)
            },
            onOpenMediaSlot: (relationPath) => {
              const targetIndex = resolveSelectedIndexFromMediaRelationPath(relationPath)
              if (typeof targetIndex === 'number') {
                setSelectedIndex(targetIndex)
              }
              setSelectedMediaPath(relationPath)
              setActiveTab('media')
            },
            onSetSlugDraft: (value) => {
              setDirty(true)
              setSlugDraft(value)
            },
            onSetTitleDraft: (value) => {
              setDirty(true)
              setTitleDraft(value)
            },
            onSetVisibilityDraft: (value) => {
              setDirty(true)
              setVisibilityDraft(value)
            },
            onToggleHidden: (index) => {
              if (index < 0) return
              toggleBlockHidden(index)
            },
            onResetDraft: resetDraftFromSaved,
            sectionSummaries,
            selectedIndex,
            heroEditor: draftPage
              ? draftPage.pagePath === '/'
                ? {
                    copy: heroCopy,
                    kind: 'marketing-home' as const,
                    eyebrow: draftPage.hero.eyebrow?.trim() || 'Grime Time exterior cleaning',
                    headlineAccent: draftPage.hero.headlineAccent?.trim() || 'Visible results.',
                    headlinePrimary: draftPage.hero.headlinePrimary?.trim() || 'Clear scope.',
                    panelBody:
                      draftPage.hero.panelBody?.trim() ||
                      'Strong visuals, clear service lanes, and a quote form that explains what moves the number.',
                    panelEyebrow: draftPage.hero.panelEyebrow?.trim() || 'Fast lane for homeowners',
                    panelHeading:
                      draftPage.hero.panelHeading?.trim() || 'Quotes and scheduling without vague contractor talk.',
                    updateField: (field, value) => {
                      mutatePage((page) => ({
                        ...page,
                        hero: {
                          ...page.hero,
                          [field]: value,
                        },
                      }))
                    },
                    updateCopy: (value) => {
                      mutatePage((page) => ({
                        ...page,
                        hero: {
                          ...page.hero,
                          richText: createLexicalParagraph(value),
                        },
                      }))
                    },
                  }
                : {
                    copy: heroCopy,
                    kind: 'rich-text' as const,
                    updateCopy: (value) => {
                      mutatePage((page) => ({
                        ...page,
                        hero: {
                          ...page.hero,
                          richText: createLexicalParagraph(value),
                        },
                      }))
                    },
                  }
              : null,
            pricingTableEditor: selectedPricingTable && selectedPricingTable.dataSource === 'inline'
              ? {
                  block: selectedPricingTable,
                  updateBlockField: (field, value) => {
                    replaceSelectedBlock({
                      ...selectedPricingTable,
                      [field]: value,
                    })
                  },
                  updateFeatureText: (featureIndex, planIndex, value) => {
                    mutateSelectedPricingPlan(planIndex, (current) => {
                      const features = [...(current.features || [])]
                      const existing = features[featureIndex]

                      if (!existing) {
                        features[featureIndex] = { text: value }
                      }
                      else {
                        features[featureIndex] = {
                          ...existing,
                          text: value,
                        }
                      }

                      return {
                        ...current,
                        features,
                      }
                    })
                  },
                  updatePlanField: (field, planIndex, value) => {
                    mutateSelectedPricingPlan(planIndex, (current) => ({
                      ...current,
                      [field]: value,
                    }))
                  },
                  updatePlanLinkLabel: (planIndex, value) => {
                    mutateSelectedPricingPlan(planIndex, (current) => ({
                      ...current,
                      link: {
                        ...current.link,
                        label: value,
                      },
                    }))
                  },
                }
              : null,
            serviceGridEditor: selectedServiceGrid
              ? {
                  addServiceLane: () => {
                    mutateSelectedServiceGrid((block) => ({
                      ...block,
                      services: [...(block.services || []), createServiceGridLaneDraft((block.services || []).length)],
                    }))
                  },
                  block: selectedServiceGrid,
                  updateBlockField: (field, value) => {
                    replaceSelectedBlock({
                      ...selectedServiceGrid,
                      [field]: value,
                    })
                  },
                  updateHighlightText: (highlightIndex, rowIndex, value) => {
                    mutateSelectedService(rowIndex, (current) => {
                      const highlights = [...(current.highlights || [])]
                      const existing = highlights[highlightIndex]

                      if (!existing) {
                        highlights[highlightIndex] = { text: value }
                      }
                      else {
                        highlights[highlightIndex] = {
                          ...existing,
                          text: value,
                        }
                      }

                      return {
                        ...current,
                        highlights,
                      }
                    })
                  },
                  updateServiceField: (field, rowIndex, value) => {
                    mutateSelectedService(rowIndex, (current) => ({
                      ...current,
                      [field]: value,
                    }))
                  },
                }
              : null,
            ctaEditor: selectedCallToAction
              ? {
                  block: selectedCallToAction,
                  updateCopy: (value) => {
                    mutateSelectedCallToAction((current) => ({
                      ...current,
                      richText: createLexicalParagraph(value),
                    }))
                  },
                  updateLinkLabel: (linkIndex, value) => {
                    mutateSelectedCallToAction((current) => {
                      const links = [...(current.links || [])]
                      const existing = links[linkIndex]

                      if (!existing) {
                        return current
                      }

                      links[linkIndex] = {
                        ...existing,
                        link: {
                          ...existing.link,
                          label: value,
                        },
                      }

                      return {
                        ...current,
                        links,
                      }
                    })
                  },
                }
              : null,
            contentBlockEditor: selectedContentBlock
              ? {
                  block: selectedContentBlock,
                  updateColumnCopy: (columnIndex, value) => {
                    mutateSelectedContentBlock((current) => {
                      const columns = [...(current.columns || [])]
                      const existing = columns[columnIndex]

                      if (!existing) {
                        return current
                      }

                      columns[columnIndex] = {
                        ...existing,
                        richText: createLexicalParagraph(value),
                      }

                      return {
                        ...current,
                        columns,
                      }
                    })
                  },
                  updateColumnLinkLabel: (columnIndex, value) => {
                    mutateSelectedContentBlock((current) => {
                      const columns = [...(current.columns || [])]
                      const existing = columns[columnIndex]

                      if (!existing || !existing.link) {
                        return current
                      }

                      columns[columnIndex] = {
                        ...existing,
                        link: {
                          ...existing.link,
                          label: value,
                        },
                      }

                      return {
                        ...current,
                        columns,
                      }
                    })
                  },
                }
              : null,
            testimonialsEditor: selectedTestimonialsBlock
              ? {
                  block: selectedTestimonialsBlock,
                  updateHeading: (value) => {
                    mutateSelectedTestimonialsBlock((current) => ({
                      ...current,
                      heading: value,
                    }))
                  },
                  updateIntro: (value) => {
                    mutateSelectedTestimonialsBlock((current) => ({
                      ...current,
                      intro: createLexicalParagraph(value),
                    }))
                  },
                }
              : null,
            slugDraft,
            titleDraft,
            visibilityDraft,
            canDeleteDraftPage: Boolean(
              draftPage &&
                typeof draftPage.id === 'number' &&
                draftPage._status !== 'published' &&
                !loading &&
                savingAction === null &&
                !deleteDraftInFlight &&
                restoringVersionId === null,
            ),
            deleteDraftPageBusy: deleteDraftInFlight,
            onDeleteDraftPage: deleteDraftPage,
          }
        : null

    window.dispatchEvent(new CustomEvent(PAGE_COMPOSER_TOOLBAR_EVENT, { detail }))

    return () => {
      window.dispatchEvent(new CustomEvent(PAGE_COMPOSER_TOOLBAR_EVENT, { detail: null }))
    }
  }, [
    canResetDraft,
    composerActivePagePath,
    deleteDraftInFlight,
    deleteDraftPage,
    draftToolbarBusy,
    draftToolbarStatusLabel,
    savingAction,
    duplicateBlock,
    dirty,
    draftPage,
    embedded,
    heroCopy,
    loading,
    mutateSelectedPricingPlan,
    mutateSelectedService,
    mutateSelectedServiceGrid,
    mutateSelectedPricingTable,
    open,
    pathname,
    removeBlock,
    replaceSelectedBlock,
    resetDraftFromSaved,
    restoringVersionId,
    sectionSummaries,
    selectedIndex,
    selectedPricingTable,
    selectedServiceGrid,
    selectedCallToAction,
    selectedContentBlock,
    selectedTestimonialsBlock,
    selectedMediaPath,
    setSelectedIndex,
    slugDraft,
    stageMediaSlot,
    setActiveTab,
    titleDraft,
    toggleBlockHidden,
    visibilityDraft,
    mutateSelectedCallToAction,
    mutateSelectedContentBlock,
    mutateSelectedTestimonialsBlock,
  ])

  function updateBlockAtIndex(index: number, block: NonNullable<PageComposerDocument['layout']>[number]) {
    mutatePage((page) => ({
      ...page,
      layout: updatePageLayoutSection({ block, index, layout: page.layout || [] }),
    }))
    setSelectedIndex(index)
  }

  function insertReusablePreset(args: { key: string; mode: 'detached' | 'linked' }) {
    const nextBlock = createReusablePresetBlock(args)

    if (!nextBlock) {
      return
    }

    applyBlockLibrarySelection(nextBlock)
  }

  function insertSharedSection(args: { item: SharedSectionRecord; mode: 'detached' | 'linked' }) {
    const nextBlock = createSharedSectionLinkedBlock({
      mode: args.mode,
      sharedSection: args.item,
    })

    if (!nextBlock) {
      setStatus('This shared section cannot be inserted until its source structure maps to a single composer block.')
      return
    }

    applyBlockLibrarySelection(nextBlock)
  }

  function detachReusableBlock(index: number) {
    const block = draftPage?.layout?.[index]

    if (!block) {
      return
    }

    const resolved = resolvePageComposerReusableBlock(block, { sharedSectionsById })
    const reusableMeta = (block as ReusableAwareLayoutBlock).composerReusable
    updateBlockAtIndex(index, {
      ...resolved,
      composerReusable: reusableMeta
        ? {
            ...reusableMeta,
            mode: 'detached',
          }
        : undefined,
    } as NonNullable<PageComposerDocument['layout']>[number])
  }

  async function submitMediaAction(args: {
    action: MediaAction
    file?: File
    mediaId?: number | null
    prompt?: string
    relationPath?: string
    success: string
  }) {
    setSubmittingMediaAction(args.action)
    setMediaStatus(null)
    try {
      const formData = new FormData()
      formData.set('action', args.action)

      if (args.action === 'create-only') {
        if (!args.file) {
          throw new Error('Choose a file to upload.')
        }
        formData.set('file', args.file)
        formData.set('alt', args.file.name.replace(/\.[a-z0-9]+$/i, ''))
        formData.set('mediaKind', getFileKind(args.file))
      } else if (args.action === 'generate-only') {
        const prompt = args.prompt?.trim()
        if (!prompt) {
          throw new Error('Enter a prompt to generate media.')
        }
        formData.set('prompt', prompt)
        formData.set('alt', prompt.slice(0, 240))
        formData.set('mediaKind', mediaKind)
        if (args.mediaId) {
          formData.set('sourceMediaId', String(args.mediaId))
        }
      } else if (args.action === 'delete-media') {
        if (!args.mediaId) {
          throw new Error('Media id is required.')
        }
        formData.set('mediaId', String(args.mediaId))
      } else if (args.action === 'replace-existing') {
        if (!args.file || !args.mediaId) {
          throw new Error('Media id and file are required.')
        }
        formData.set('mediaId', String(args.mediaId))
        formData.set('file', args.file)
        formData.set(
          'alt',
          args.prompt?.trim() || args.file.name.replace(/\.[a-z0-9]+$/i, ''),
        )
        formData.set('mediaKind', getFileKind(args.file))
      } else {
        if (!draftPage?.id) {
          throw new Error('Save this route as a page draft before editing media.')
        }
        const relationPath = args.relationPath?.trim()
        if (!relationPath) {
          throw new Error('A media slot path is required.')
        }
        if (args.action === 'swap-existing-reference' && args.mediaId) {
          const libraryItem = mediaLibrary.find((item) => item.id === args.mediaId)
          if (libraryItem?.media) {
            stageMediaSlot(libraryItem.media, relationPath)
            setMediaPrompt('')
            setMediaStatus(args.success)
            return
          }
        }
        formData.set('pageId', String(draftPage.id))
        formData.set('relationPath', relationPath)
        formData.set('mediaKind', args.file ? getFileKind(args.file) : mediaKind)
        if (args.file) formData.set('file', args.file)
        if (args.mediaId) {
          formData.set('mediaId', String(args.mediaId))
          formData.set('sourceMediaId', String(args.mediaId))
        }
        if (args.prompt?.trim()) {
          formData.set('prompt', args.prompt.trim())
          formData.set('alt', args.prompt.trim().slice(0, 240))
        }
      }

      const response = await fetch('/api/internal/page-composer/media', { body: formData, method: 'POST' })
      const payload = await parseResponseJson<null | { error?: string }>(response)
      if (!response.ok) throw new Error(payload?.error || 'Unable to update section media.')
      setMediaPrompt('')
      setMediaStatus(args.success)
      if (
        args.action === 'create-only' ||
        args.action === 'generate-only' ||
        args.action === 'replace-existing'
      ) {
        await loadMediaLibrary()
      } else {
        await loadPage()
        await loadMediaLibrary()
      }
      router.refresh()
    } catch (error) {
      setMediaStatus(error instanceof Error ? error.message : 'Unable to update section media.')
    } finally {
      setSubmittingMediaAction(null)
    }
  }

  if (!enabled || !composer) return null

  const blockLibrary = {
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
    isBlockLibraryOpen,
    openSharedSectionSourceEditor,
    sharedSectionsLoading,
    sharedSectionsStatus,
    setBlockLibraryQuery,
  }

  const page = {
    draftPage,
    loading,
    status,
  }

  const sections = {
    detachReusableBlock,
    duplicateBlock,
    handleDragEnd,
    heroSummary,
    layoutSectionSummaries,
    mutateSelectedService,
    mutateSelectedServiceGrid,
    openBlockLibrary,
    removeBlock,
    sectionSummaries,
    selectedBlock,
    resolvedSelectedBlock,
    selectedBlockIsLinkedSharedSection,
    selectedIndex,
    selectedServiceGrid,
    selectedSharedSectionId,
    selectedSummary,
    sensors,
    setSelectedIndex,
    toggleBlockHidden,
  }

  const media = {
    copilot: copilot
      ? {
          openFocusedMediaSession: copilot.openFocusedMediaSession,
        }
      : null,
    dirty,
    draftPage,
    loadMediaLibrary,
    mediaActionsLocked,
    mediaKind,
    mediaLibrary,
    mediaLoading,
    mediaPrompt,
    mediaPromptId,
    mediaUploadInputRef,
    setMediaKind,
    setMediaPrompt,
    selectedMediaSlot,
    submitMediaAction,
    submittingMediaAction,
  }

  const history = {
    bulkDeleteBusy: bulkPhraseBusy,
    bulkPages: {
      onClear: clearMarketingSelection,
      onRequestDelete: requestBulkDeleteMarketingPages,
      onSelectAll: selectAllMarketingPages,
      onToggle: toggleMarketingPageSelect,
      selectedIds: selectedMarketingPageIds,
    },
    bulkVersions: {
      onClear: clearVersionSelection,
      onRequestDelete: requestBulkDeleteVersions,
      onSelectAll: selectAllDeletableVersions,
      onToggle: toggleVersionSelect,
      selectedIds: selectedVersionIds,
    },
    currentPath: pathname,
    deletingPageId,
    marketingPages,
    onDeletePage: requestDeletePageFromIndex,
    onNavigateToPage: navigateComposerToPage,
    pageVersions,
    persistPage,
    restoringVersionId,
    restorePageVersion,
    savingAction,
  }

  return (
    <>
      <PageComposerDrawerShell
        activeTab={activeTab}
        blockLibrary={blockLibrary}
        embedded={embedded}
        enabled={enabled}
        isOpen={open}
        media={media}
        onDismiss={onRequestClose || composer.close}
        page={page}
        history={history}
        sections={sections}
        tabs={{ setActiveTab }}
      />
      <TypePathConfirmDialog
        busy={deletingPageId !== null}
        confirmButtonLabel="Delete page"
        description={
          pendingDeletePage?.isPublished ? (
            <span className="block">
              This removes the published page and its live URL. You cannot undo it.
            </span>
          ) : (
            <span className="block">This removes the page from the CMS. You cannot undo it.</span>
          )
        }
        expectedPath={pendingDeletePage?.pagePath ?? ''}
        onConfirm={async () => {
          if (!pendingDeletePage) {
            return
          }
          await runDeletePageFromIndex(pendingDeletePage)
        }}
        onOpenChange={(next) => {
          if (!next) {
            setPendingDeletePage(null)
          }
        }}
        open={pendingDeletePage !== null}
        title={pendingDeletePage?.isPublished ? 'Delete this published page?' : 'Delete this page?'}
      />
      <PhraseConfirmDialog
        busy={bulkPhraseBusy}
        confirmButtonLabel="Delete selected"
        description={
          bulkPhraseTarget === 'pages' ? (
            <span className="block">
              This permanently removes the selected marketing pages from the CMS. Published URLs will stop resolving for those routes.
            </span>
          ) : (
            <span className="block">
              This permanently removes the selected draft snapshots. You cannot undo it.
            </span>
          )
        }
        onConfirm={async () => {
          setBulkPhraseBusy(true)
          try {
            if (bulkPhraseTarget === 'pages') {
              await runBulkDeletePages()
            } else if (bulkPhraseTarget === 'versions') {
              await runBulkDeleteVersions()
            }
          } finally {
            setBulkPhraseBusy(false)
          }
        }}
        onOpenChange={(next) => {
          if (!next) {
            setBulkPhraseTarget(null)
          }
        }}
        open={bulkPhraseTarget !== null}
        title={
          bulkPhraseTarget === 'pages'
            ? `Delete ${selectedMarketingPageIds.length} marketing page(s)?`
            : `Delete ${selectedVersionIds.length} draft snapshot(s)?`
        }
      />
    </>
  )
}
