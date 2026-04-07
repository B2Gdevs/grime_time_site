'use client'

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { usePathname, useRouter } from 'next/navigation'
import { motion, useDragControls } from 'motion/react'
import { FilePenLineIcon, GripVerticalIcon, ImageIcon, RocketIcon, TypeIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

import {
  PAGE_COMPOSER_TOOLBAR_EVENT,
  usePageComposerOptional,
  type PageComposerTab,
  type PageComposerToolbarState,
} from '@/components/admin-impersonation/PageComposerContext'
import { usePortalCopilotOptional } from '@/components/copilot/PortalCopilotContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { buildMediaDevtoolsSummary, type MediaDevtoolsSummary } from '@/lib/media/pageMediaDevtools'
import { isUnknownRecord } from '@/lib/is-unknown-record'
import {
  buildPageComposerValidationSummary,
  buildPageComposerSectionSummaries,
  countPageComposerChangedBlocks,
  duplicatePageLayoutSection,
  insertPageLayoutRegisteredBlock,
  removePageLayoutSection,
  togglePageLayoutSectionHidden,
  type PageComposerDocument,
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
import { PageComposerDrawerBlockLibrary } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerBlockLibrary'
import { PageComposerDrawerContentTab } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerContentTab'
import { PageComposerDrawerFooter } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerFooter'
import { PageComposerDrawerMediaTab } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaTab'
import { PageComposerDrawerPublishTab } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerPublishTab'
import { PageComposerDrawerStructureTab } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerStructureTab'

import { adminPanelChrome } from './adminPanelChrome'

type MediaAction = 'create-and-swap' | 'generate-and-swap' | 'swap-existing-reference'
type SavingAction = 'publish-page' | 'save-draft'
type ServiceGridService = NonNullable<ServiceGridBlock['services']>[number]
type PricingPlan = NonNullable<NonNullable<Extract<ReusableAwareLayoutBlock, { blockType: 'pricingTable' }>['inlinePlans']>>[number]

type MediaLibraryItem = {
  alt: null | string
  filename: null | string
  id: number
  mimeType: null | string
  previewUrl: null | string
  updatedAt: string
}

type BlockLibraryMode = 'insert' | 'replace'

type SectionMediaSlot = {
  label: string
  media: MediaDevtoolsSummary | null
  mediaId: number | null
  mimeType: null | string
  relationPath: string
}

type PageComposerResponse = {
  error?: string
  page?: PageComposerDocument
  versions?: PageComposerVersionSummary[]
}

function asMedia(value: Media | null | number | undefined): Media | null {
  return isUnknownRecord(value) ? (value as Media) : null
}

function getFileKind(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

export function PageComposerLauncherButton({
  className,
  label = 'Page composer',
  variant = 'ghost',
}: {
  className?: string
  label?: string
  variant?: 'default' | 'ghost' | 'outline' | 'secondary'
}) {
  const composer = usePageComposerOptional()

  if (!composer) {
    return null
  }

  return (
    <Button
      className={className}
      onClick={composer.isOpen ? composer.close : composer.open}
      size="sm"
      type="button"
      variant={variant}
    >
      <FilePenLineIcon className="h-4 w-4" />
      {composer.isOpen ? 'Close composer' : label}
    </Button>
  )
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
  const dragControls = useDragControls()
  const setCopilotAuthoringContext = copilot?.setAuthoringContext
  const composerActivePagePath = composer?.activePagePath
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const [blockLibraryQuery, setBlockLibraryQuery] = useState('')
  const [blockLibraryMode, setBlockLibraryMode] = useState<BlockLibraryMode>('insert')
  const [blockLibraryTargetIndex, setBlockLibraryTargetIndex] = useState<null | number>(null)
  const [creatingDraftClone, setCreatingDraftClone] = useState(false)
  const [draftPage, setDraftPage] = useState<null | PageComposerDocument>(null)
  const [isBlockLibraryOpen, setIsBlockLibraryOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mediaKind, setMediaKind] = useState<'image' | 'video'>('image')
  const [mediaLibrary, setMediaLibrary] = useState<MediaLibraryItem[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaPrompt, setMediaPrompt] = useState('')
  const [, setMediaStatus] = useState<null | string>(null)
  const [pageVersions, setPageVersions] = useState<PageComposerVersionSummary[]>([])
  const [selectedMediaPath, setSelectedMediaPath] = useState<null | string>(null)
  const [restoringVersionId, setRestoringVersionId] = useState<null | string>(null)
  const [submittingMediaAction, setSubmittingMediaAction] = useState<null | MediaAction>(null)
  const [savingAction, setSavingAction] = useState<null | SavingAction>(null)
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
    if (!selectedServiceGrid) return []
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
  }, [selectedIndex, selectedServiceGrid])
  const selectedMediaSlot = mediaSlots.find((slot) => slot.relationPath === selectedMediaPath) || mediaSlots[0] || null
  const mediaActionsLocked = dirty || !draftPage || !selectedMediaSlot
  const heroSummary = sectionSummaries.find((summary) => summary.index === -1) || null
  const layoutSectionSummaries = sectionSummaries.filter((summary) => summary.index >= 0)
  const changedBlockCount = useMemo(
    () =>
      countPageComposerChangedBlocks({
        baselineLayout: savedPage?.layout,
        draftLayout: draftPage?.layout,
      }),
    [draftPage?.layout, savedPage?.layout],
  )
  const validationSummary = useMemo(
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
    if (!sectionSummaries.length) {
      setSelectedIndex(0)
      return
    }

    if (!sectionSummaries.some((summary) => summary.index === selectedIndex)) {
      setSelectedIndex(sectionSummaries[0]?.index ?? 0)
    }
  }, [sectionSummaries, selectedIndex, setSelectedIndex])

  useEffect(() => {
    if (!mediaSlots.length) return setSelectedMediaPath(null)
    setSelectedMediaPath((current) =>
      current && mediaSlots.some((slot) => slot.relationPath === current) ? current : mediaSlots[0]?.relationPath || null,
    )
  }, [mediaSlots])

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

    setCopilotAuthoringContext({
      mediaSlot: selectedMediaSlot
        ? {
            label: selectedMediaSlot.label,
            mediaId: selectedMediaSlot.mediaId,
            mimeType: selectedMediaSlot.mimeType,
            relationPath: selectedMediaSlot.relationPath,
          }
        : null,
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
  }, [draftPage, selectedMediaSlot, selectedSummary, setCopilotAuthoringContext])

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

  async function persistPage(action: SavingAction) {
    if (!draftPage) return
    setSavingAction(action)
    setStatus(null)
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
      setDraftPage(payload.page)
      setPageVersions(payload.versions || [])
      setSavedPage(payload.page)
      setTitleDraft(payload.page.title || '')
      setSlugDraft(payload.page.slug || '')
      setVisibilityDraft(payload.page.visibility === 'private' ? 'private' : 'public')
      setDirty(false)
      setStatus(
        action === 'publish-page'
          ? draftPage.id
            ? 'Page published.'
            : 'Page created and published.'
          : draftPage.id
            ? 'Draft saved.'
            : 'Draft created.',
      )
      if (payload.page.pagePath !== pathname) {
        router.push(payload.page.pagePath)
      }
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save the page.')
    } finally {
      setSavingAction(null)
    }
  }

  const createDraftClone = useCallback(async () => {
    if (!draftPage || typeof draftPage.id !== 'number') return

    if (dirty) {
      setStatus('Save or publish the current page before creating a new draft from it.')
      return
    }

    setCreatingDraftClone(true)
    setStatus(null)

    try {
      const response = await fetch('/api/internal/page-composer', {
        body: JSON.stringify({
          action: 'clone-page',
          sourcePageId: draftPage.id,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      const payload = await parseResponseJson<null | PageComposerResponse>(response)

      if (!response.ok || !payload?.page) {
        throw new Error(payload?.error || 'Unable to create the page draft.')
      }

      setDraftPage(payload.page)
      setPageVersions(payload.versions || [])
      setSavedPage(payload.page)
      setTitleDraft(payload.page.title || '')
      setSlugDraft(payload.page.slug || '')
      setVisibilityDraft(payload.page.visibility === 'private' ? 'private' : 'public')
      setSelectedIndex(0)
      setDirty(false)
      setStatus('Draft created from the current page.')
      setActiveTab('content')
      router.push(payload.page.pagePath)
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to create the page draft.')
    } finally {
      setCreatingDraftClone(false)
    }
  }, [dirty, draftPage, router, setActiveTab, setSelectedIndex])

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
            creatingDraftClone,
            dirty,
            draftPage,
            loading,
            onAddAbove: (index) => openBlockLibrary(index < 0 ? 0 : index),
            onAddBelow: (index) => openBlockLibrary(index < 0 ? 0 : index + 1),
            onCreateDraft: () => void createDraftClone(),
            onDeleteBlock: (index) => {
              if (index < 0) return
              removeBlock(index)
            },
            onDuplicateBlock: (index) => {
              if (index < 0) return
              duplicateBlock(index)
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
          }
        : null

    window.dispatchEvent(new CustomEvent(PAGE_COMPOSER_TOOLBAR_EVENT, { detail }))

    return () => {
      window.dispatchEvent(new CustomEvent(PAGE_COMPOSER_TOOLBAR_EVENT, { detail: null }))
    }
  }, [
    composerActivePagePath,
    creatingDraftClone,
    createDraftClone,
    duplicateBlock,
    dirty,
    draftPage,
    embedded,
    heroCopy,
    loading,
    mutateSelectedPricingPlan,
    mutateSelectedService,
    mutateSelectedPricingTable,
    open,
    pathname,
    removeBlock,
    replaceSelectedBlock,
    sectionSummaries,
    selectedIndex,
    selectedPricingTable,
    selectedServiceGrid,
    selectedCallToAction,
    selectedContentBlock,
    selectedTestimonialsBlock,
    slugDraft,
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
    relationPath: string
    success: string
  }) {
    if (!draftPage) return
    setSubmittingMediaAction(args.action)
    setMediaStatus(null)
    try {
      if (!draftPage.id) {
        throw new Error('Save this route as a page draft before editing media.')
      }
      const formData = new FormData()
      formData.set('action', args.action)
      formData.set('pageId', String(draftPage.id))
      formData.set('relationPath', args.relationPath)
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
      const response = await fetch('/api/internal/page-composer/media', { body: formData, method: 'POST' })
      const payload = await parseResponseJson<null | { error?: string }>(response)
      if (!response.ok) throw new Error(payload?.error || 'Unable to update section media.')
      setMediaPrompt('')
      setMediaStatus(args.success)
      await loadPage()
      await loadMediaLibrary()
      router.refresh()
    } catch (error) {
      setMediaStatus(error instanceof Error ? error.message : 'Unable to update section media.')
    } finally {
      setSubmittingMediaAction(null)
    }
  }

  if (!enabled || !composer) return null
  if (!open) return null

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    dragControls.start(event)
  }

  const showInlineAdminBar = !embedded

  const panel = (
    <aside
      aria-label="Page composer"
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border bg-background shadow-2xl"
      role="complementary"
    >
      {!embedded ? (
        <div className={adminPanelChrome.drawerHeaderBetweenCenter}>
          <div className="flex items-center gap-3">
            <button
              aria-label="Move page composer"
              className="inline-flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-xl border border-border/70 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground active:cursor-grabbing"
              onPointerDown={startDrag}
              type="button"
            >
              <GripVerticalIcon className="h-4 w-4" />
            </button>
            <div>
              <p className={adminPanelChrome.chromeKicker}>Staff beta</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">Visual composer</h2>
              {/* editing block section heading: selected block name and type */}
              <h3 className="mt-1 text-lg font-semibold tracking-tight">{selectedBlock?.blockName || 'Selected block'} {selectedBlock?.blockType || 'Block type'}</h3>
            </div>
          </div>
          <Button
            aria-label="Dismiss page composer"
            onClick={onRequestClose || composer.close}
            size="icon"
            type="button"
            variant="ghost"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">


        <Tabs
          className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden"
          onValueChange={(value) => setActiveTab(value as PageComposerTab)}
          value={activeTab}
        >
          {showInlineAdminBar ? (
            <div className={adminPanelChrome.drawerTabsStrip}>
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl p-1">
                <TabsTrigger value="content">
                  <span className="inline-flex items-center gap-2">
                    <TypeIcon className="h-4 w-4" />
                    Content
                  </span>
                </TabsTrigger>
                <TabsTrigger value="media">
                  <span className="inline-flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Media
                  </span>
                </TabsTrigger>
                <TabsTrigger value="publish">
                  <span className="inline-flex items-center gap-2">
                    <RocketIcon className="h-4 w-4" />
                    Publish
                  </span>
                </TabsTrigger>
              </TabsList>
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
              openBlockLibrary={openBlockLibrary}
              removeBlock={removeBlock}
              sectionSummaries={sectionSummaries}
              selectedIndex={selectedIndex}
              sensors={sensors}
              setSelectedIndex={setSelectedIndex}
              status={status}
              toggleBlockHidden={toggleBlockHidden}
            />
          </TabsContent>

          <TabsContent className="portal-scroll mt-0 min-h-0 px-5 py-4" value="content">
            <PageComposerDrawerContentTab
              detachReusableBlock={detachReusableBlock}
              draftPage={draftPage}
              loading={loading}
              mutateSelectedService={mutateSelectedService}
              mutateSelectedServiceGrid={mutateSelectedServiceGrid}
              openBlockLibrary={openBlockLibrary}
              openSharedSectionSourceEditor={openSharedSectionSourceEditor}
              removeBlock={removeBlock}
              replaceSelectedBlock={replaceSelectedBlock}
              selectedBlock={selectedBlock}
              selectedBlockIsLinkedSharedSection={selectedBlockIsLinkedSharedSection}
              selectedIndex={selectedIndex}
              selectedSharedSectionId={selectedSharedSectionId}
              selectedSummary={selectedSummary}
              status={status}
            />
          </TabsContent>

          <TabsContent className="portal-scroll mt-0 min-h-0 px-5 py-4" value="media">
            <PageComposerDrawerMediaTab
              copilot={copilot ? { openFocusedMediaSession: copilot.openFocusedMediaSession } : null}
              dirty={dirty}
              draftPage={draftPage ? { pagePath: draftPage.pagePath } : null}
              loadMediaLibrary={loadMediaLibrary}
              loading={loading}
              mediaActionsLocked={mediaActionsLocked}
              mediaKind={mediaKind}
              mediaLibrary={mediaLibrary}
              mediaLoading={mediaLoading}
              mediaPrompt={mediaPrompt}
              mediaPromptId={mediaPromptId}
              mediaSlots={mediaSlots}
              selectedIndex={selectedIndex}
              selectedMediaSlot={selectedMediaSlot}
              selectedServiceGrid={selectedServiceGrid}
              setMediaKind={setMediaKind}
              setMediaPrompt={setMediaPrompt}
              setSelectedMediaPath={setSelectedMediaPath}
              submitMediaAction={submitMediaAction}
              submittingMediaAction={submittingMediaAction}
              mediaUploadInputRef={mediaUploadInputRef}
            />
          </TabsContent>

          <TabsContent className="portal-scroll mt-0 min-h-0 px-5 py-4" value="publish">
            <PageComposerDrawerPublishTab
              changedBlockCount={changedBlockCount}
              dirty={dirty}
              draftPage={draftPage}
              loading={loading}
              pageVersions={pageVersions}
              restoringVersionId={restoringVersionId}
              savingAction={savingAction}
              sectionCount={sectionSummaries.length}
              slugDraft={slugDraft}
              validationSummary={validationSummary}
              visibilityDraft={visibilityDraft}
              restorePageVersion={restorePageVersion}
            />
          </TabsContent>

          <PageComposerDrawerFooter draftPage={draftPage} persistPage={persistPage} restoringVersionId={restoringVersionId} savingAction={savingAction} />
        </Tabs>

        {isBlockLibraryOpen ? (
          <PageComposerDrawerBlockLibrary
            blockLibraryMode={blockLibraryMode}
            blockLibraryQuery={blockLibraryQuery}
            blockLibraryTargetIndex={blockLibraryTargetIndex}
            closeBlockLibrary={() => {
              setIsBlockLibraryOpen(false)
              setBlockLibraryTargetIndex(null)
            }}
            filteredBlockDefinitions={filteredBlockDefinitions as Array<{
              category: string
              description: string
              label: string
              supportsInsert: boolean
              supportsReusable: boolean
              type: string
            }>}
            filteredReusablePresets={filteredReusablePresets}
            filteredSharedSections={filteredSharedSections}
            insertRegisteredBlock={(type) => insertRegisteredBlock(type as PageComposerInsertableBlockType)}
            insertReusablePreset={insertReusablePreset}
            insertSharedSection={insertSharedSection}
            openSharedSectionSourceEditor={openSharedSectionSourceEditor}
            sharedSectionsLoading={sharedSectionsLoading}
            sharedSectionsStatus={sharedSectionsStatus}
            setBlockLibraryQuery={setBlockLibraryQuery}
          />
        ) : null}
      </div>
    </aside>
  )

  if (embedded) {
    return panel
  }

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      aria-label="Page composer"
      aria-modal="false"
      className="fixed right-4 top-[5.5rem] z-[96] w-[min(36rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]"
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.98 }}
      role="dialog"
      transition={{ duration: 0.16, ease: 'easeOut' }}
    >
      <div className="h-[min(44rem,calc(100vh-6rem))]">{panel}</div>
    </motion.div>
  )
}


