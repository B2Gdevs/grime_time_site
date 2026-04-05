'use client'
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { usePathname, useRouter } from 'next/navigation'
import {
  CopyPlusIcon,
  EyeIcon,
  EyeOffIcon,
  FilePenLineIcon,
  GripVerticalIcon,
  ImageIcon,
  Link2Icon,
  LoaderCircleIcon,
  PlusIcon,
  RefreshCwIcon,
  RocketIcon,
  SparklesIcon,
  SquarePenIcon,
  Trash2Icon,
  TypeIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePageComposerOptional } from '@/components/admin-impersonation/PageComposerContext'
import { PageComposerPreview, type PageComposerPreviewMode } from '@/components/admin-impersonation/PageComposerPreview'
import { usePortalCopilotOptional } from '@/components/copilot/PortalCopilotContext'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { buildMediaDevtoolsSummary, type MediaDevtoolsSummary } from '@/lib/media/pageMediaDevtools'
import {
  buildPageComposerValidationSummary,
  buildPageComposerNotices,
  buildPageComposerSectionSummaries,
  countPageComposerChangedBlocks,
  duplicatePageLayoutSection,
  insertPageLayoutRegisteredBlock,
  pageSlugToFrontendPath,
  removePageLayoutSection,
  togglePageLayoutSectionHidden,
  type PageComposerDocument,
  type PageComposerNotice,
  type PageComposerPageSummary,
  type PageComposerSectionSummary,
  updatePageLayoutSection,
} from '@/lib/pages/pageComposer'
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
import type { Media, ServiceGridBlock } from '@/payload-types'

type ComposerTab = 'content' | 'media' | 'publish' | 'structure'
type MediaAction = 'create-and-swap' | 'generate-and-swap' | 'swap-existing-reference'
type SavingAction = 'publish-page' | 'save-draft'
type ServiceGridService = NonNullable<ServiceGridBlock['services']>[number]

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

function formatTimestamp(value: null | string | undefined): string {
  if (!value) return 'Not published'
  try {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  } catch {
    return value
  }
}

function asMedia(value: Media | null | number | undefined): Media | null {
  return value && typeof value === 'object' ? value : null
}

function getFileKind(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

function getMediaKindFromMimeType(mimeType: null | string | undefined): 'image' | 'video' {
  return mimeType?.startsWith('video/') ? 'video' : 'image'
}

function ComposerNoticeList({ notices }: { notices: PageComposerNotice[] }) {
  if (!notices.length) {
    return null
  }

  return (
    <div className="grid gap-3">
      {notices.map((notice) => (
        <div
          key={notice.id}
          className={`rounded-2xl border p-4 text-sm ${
            notice.tone === 'warning'
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100'
              : 'border-border/70 bg-card/50 text-muted-foreground'
          }`}
        >
          <div className="font-semibold text-foreground">{notice.title}</div>
          <div className="mt-1">{notice.description}</div>
        </div>
      ))}
    </div>
  )
}

function HeaderField({
  icon,
  label,
  onChange,
  placeholder,
  value,
}: {
  icon: ReactNode
  label: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">{icon}</div>
        <Input className="h-10 pl-10" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
      </div>
    </label>
  )
}

function StructureInsertButton({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <button
      className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-card/40 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
      onClick={onClick}
      type="button"
    >
      <PlusIcon className="h-4 w-4" />
      Add block
    </button>
  )
}

function SortableSectionRow({
  active,
  onAddBelow,
  onClick,
  onDuplicate,
  onRemove,
  onToggleHidden,
  summary,
}: {
  active: boolean
  onAddBelow: () => void
  onClick: () => void
  onDuplicate: () => void
  onRemove: () => void
  onToggleHidden: () => void
  summary: PageComposerSectionSummary
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: String(summary.index) })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border p-3 transition ${
        active ? 'border-primary/60 bg-primary/5' : 'border-border/70 bg-card/50'
      } ${summary.hidden ? 'opacity-75' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button className="mt-0.5 rounded-lg border border-border/70 bg-background p-2 text-muted-foreground" type="button" {...attributes} {...listeners}>
          <GripVerticalIcon className="h-4 w-4" />
        </button>
        <button className="min-w-0 flex-1 text-left" onClick={onClick} type="button">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{summary.label}</span>
            <Badge variant="outline">{summary.blockType}</Badge>
            {summary.variant ? <Badge variant="secondary">{summary.variant}</Badge> : null}
            {summary.badges
              .filter((badge) => badge !== summary.variant)
              .map((badge) => (
                <Badge key={badge} variant={badge === 'reusable' ? 'secondary' : 'outline'}>
                  {badge}
                </Badge>
              ))}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{summary.description}</div>
        </button>
        <div className="flex shrink-0 gap-2">
          <Button
            aria-label={`${summary.hidden ? 'Show' : 'Hide'} block ${summary.label}`}
            onClick={onToggleHidden}
            size="icon"
            type="button"
            variant="ghost"
          >
            {summary.hidden ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
          </Button>
          <Button aria-label={`Add block below ${summary.label}`} onClick={onAddBelow} size="icon" type="button" variant="ghost">
            <PlusIcon className="h-4 w-4" />
          </Button>
          <Button onClick={onDuplicate} size="icon" type="button" variant="ghost">
            <CopyPlusIcon className="h-4 w-4" />
          </Button>
          <Button onClick={onRemove} size="icon" type="button" variant="ghost">
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
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

export function PageComposerDrawer({ enabled }: { enabled: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const composer = usePageComposerOptional()
  const copilot = usePortalCopilotOptional()
  const setCopilotAuthoringContext = copilot?.setAuthoringContext
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const [activeTab, setActiveTab] = useState<ComposerTab>('structure')
  const [availablePages, setAvailablePages] = useState<PageComposerPageSummary[]>([])
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
  const [mediaStatus, setMediaStatus] = useState<null | string>(null)
  const [selectedMediaPath, setSelectedMediaPath] = useState<null | string>(null)
  const [submittingMediaAction, setSubmittingMediaAction] = useState<null | MediaAction>(null)
  const [previewMode, setPreviewMode] = useState<PageComposerPreviewMode>('desktop')
  const [savingAction, setSavingAction] = useState<null | SavingAction>(null)
  const [savedPage, setSavedPage] = useState<null | PageComposerDocument>(null)
  const [sharedSections, setSharedSections] = useState<SharedSectionRecord[]>([])
  const [sharedSectionsLoading, setSharedSectionsLoading] = useState(false)
  const [sharedSectionsStatus, setSharedSectionsStatus] = useState<null | string>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [status, setStatus] = useState<null | string>(null)
  const [titleDraft, setTitleDraft] = useState('')
  const [slugDraft, setSlugDraft] = useState('')
  const [visibilityDraft, setVisibilityDraft] = useState<'private' | 'public'>('public')
  const [dirty, setDirty] = useState(false)
  const mediaUploadInputRef = useRef<HTMLInputElement | null>(null)
  const mediaPromptId = useId()
  const open = composer?.isOpen ?? false

  const sharedSectionsById = useMemo(
    () => new Map(sharedSections.map((item) => [item.id, item])),
    [sharedSections],
  )
  const sectionSummaries = useMemo(
    () => buildPageComposerSectionSummaries(draftPage?.layout, sharedSectionsById),
    [draftPage?.layout, sharedSectionsById],
  )
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
  const resolvedSelectedBlock = selectedBlock
    ? resolvePageComposerReusableBlock(selectedBlock, { sharedSectionsById })
    : null
  const selectedServiceGrid =
    resolvedSelectedBlock?.blockType === 'serviceGrid'
      ? (resolvedSelectedBlock as ServiceGridBlock)
      : null
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
  const footerStatus = status || mediaStatus || 'Page edits stay local until you save or publish.'
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
  const composerNotices = useMemo<PageComposerNotice[]>(
    () =>
      draftPage
        ? buildPageComposerNotices({
            page: draftPage,
            selectedBlock: resolvedSelectedBlock || undefined,
          })
        : [],
    [draftPage, resolvedSelectedBlock],
  )

  useEffect(() => {
    if (!sectionSummaries.length) return setSelectedIndex(0)
    setSelectedIndex((current) => Math.min(current, sectionSummaries.length - 1))
  }, [sectionSummaries.length])

  useEffect(() => {
    if (!mediaSlots.length) return setSelectedMediaPath(null)
    setSelectedMediaPath((current) =>
      current && mediaSlots.some((slot) => slot.relationPath === current) ? current : mediaSlots[0]?.relationPath || null,
    )
  }, [mediaSlots])

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
      section: sectionSummaries[selectedIndex]
        ? {
            blockType: sectionSummaries[selectedIndex].blockType,
            description: sectionSummaries[selectedIndex].description,
            index: sectionSummaries[selectedIndex].index,
            label: sectionSummaries[selectedIndex].label,
            variant: sectionSummaries[selectedIndex].variant,
          }
        : null,
      surface: 'page-composer',
    })
  }, [draftPage, sectionSummaries, selectedIndex, selectedMediaSlot, setCopilotAuthoringContext])

  const loadPage = useCallback(
    async (args?: { pageId?: number; pagePath?: string }) => {
      if (!enabled) return

      const query = args?.pageId
        ? `pageId=${args.pageId}`
        : `pagePath=${encodeURIComponent(args?.pagePath || pathname)}`

      setLoading(true)
      setStatus(null)

      try {
        const response = await fetch(`/api/internal/page-composer?${query}`)
        const payload = (await response.json().catch(() => null)) as
          | null
          | { error?: string; page?: PageComposerDocument; pages?: PageComposerPageSummary[] }

        if (!response.ok || !payload?.page) {
          throw new Error(payload?.error || 'Unable to load the page composer.')
        }

        setAvailablePages(payload.pages || [])
        setDraftPage(payload.page)
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
    [enabled, pathname],
  )

  const loadMediaLibrary = useCallback(async () => {
    if (!enabled || !open) return
    setMediaLoading(true)
    setMediaStatus(null)
    try {
      const response = await fetch('/api/internal/page-composer/media')
      const payload = (await response.json().catch(() => null)) as null | { error?: string; items?: MediaLibraryItem[] }
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
      const payload = (await response.json().catch(() => null)) as
        | null
        | { error?: string; items?: SharedSectionRecord[] }
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

  function replaceSelectedBlock(block: NonNullable<PageComposerDocument['layout']>[number]) {
    mutatePage((page) => ({
      ...page,
      layout: updatePageLayoutSection({ block, index: selectedIndex, layout: page.layout || [] }),
    }))
  }

  function mutateSelectedServiceGrid(mutator: (block: ServiceGridBlock) => ServiceGridBlock) {
    if (!selectedServiceGrid) return
    replaceSelectedBlock(mutator(selectedServiceGrid))
  }

  function mutateSelectedService(serviceIndex: number, mutator: (service: ServiceGridService) => ServiceGridService) {
    mutateSelectedServiceGrid((block) => {
      const services = [...(block.services || [])]
      const current = services[serviceIndex]
      if (!current) return block
      services[serviceIndex] = mutator(current)
      return { ...block, services }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = Number(event.active.id)
    const overId = Number(event.over?.id)
    if (!Number.isInteger(activeId) || !Number.isInteger(overId) || activeId === overId) return
    mutatePage((page) => ({ ...page, layout: arrayMove(page.layout || [], activeId, overId) }))
    setSelectedIndex(overId)
  }

  function openBlockLibrary(index: number, mode: BlockLibraryMode = 'insert') {
    setBlockLibraryMode(mode)
    setBlockLibraryTargetIndex(index)
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
          slug: slugDraft.trim(),
          title: titleDraft.trim(),
          visibility: visibilityDraft,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      const payload = (await response.json().catch(() => null)) as
        | null
        | { error?: string; page?: PageComposerDocument; pages?: PageComposerPageSummary[] }
      if (!response.ok || !payload?.page) throw new Error(payload?.error || 'Unable to save the page.')
      setAvailablePages(payload.pages || [])
      setDraftPage(payload.page)
      setSavedPage(payload.page)
      setTitleDraft(payload.page.title || '')
      setSlugDraft(payload.page.slug || '')
      setVisibilityDraft(payload.page.visibility === 'private' ? 'private' : 'public')
      setDirty(false)
      setStatus(action === 'publish-page' ? 'Page published.' : 'Draft saved.')
      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save the page.')
    } finally {
      setSavingAction(null)
    }
  }

  async function createDraftClone() {
    if (!draftPage) return

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
      const payload = (await response.json().catch(() => null)) as
        | null
        | { error?: string; page?: PageComposerDocument; pages?: PageComposerPageSummary[] }

      if (!response.ok || !payload?.page) {
        throw new Error(payload?.error || 'Unable to create the page draft.')
      }

      setAvailablePages(payload.pages || [])
      setDraftPage(payload.page)
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
  }

  function switchToPage(pageId: number) {
    if (dirty) {
      setStatus('Save, publish, or reload the current page before switching to another page.')
      return
    }

    const nextPage = availablePages.find((page) => Number(page.id) === pageId)
    setSelectedIndex(0)
    void loadPage({ pageId })

    if (nextPage) {
      router.push(nextPage.pagePath)
      router.refresh()
    }
  }

  function duplicateBlock(index: number) {
    mutatePage((page) => ({
      ...page,
      layout: duplicatePageLayoutSection({ index, layout: page.layout || [] }),
    }))
    setSelectedIndex(index + 1)
  }

  function removeBlock(index: number) {
    mutatePage((page) => ({
      ...page,
      layout: removePageLayoutSection({ index, layout: page.layout || [] }),
    }))
    setSelectedIndex(Math.max(0, index - 1))
  }

  function toggleBlockHidden(index: number) {
    mutatePage((page) => ({
      ...page,
      layout: togglePageLayoutSectionHidden({
        index,
        layout: page.layout || [],
      }),
    }))
    setSelectedIndex(index)
  }

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
      const payload = (await response.json().catch(() => null)) as null | { error?: string }
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

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.aside
          className="page-composer-rail relative hidden h-[100dvh] min-h-screen w-[min(46rem,calc(100vw-4rem))] shrink-0 flex-col border-l border-border/70 bg-background/96 shadow-2xl backdrop-blur lg:flex"
          initial={{ opacity: 0, width: 0, x: 40 }}
          animate={{ opacity: 1, width: 'min(46rem, calc(100vw - 4rem))', x: 0 }}
          exit={{ opacity: 0, width: 0, x: 40 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
              <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Visual composer</Badge>
                    {draftPage ? <Badge variant="secondary">{draftPage.pagePath}</Badge> : null}
                    {draftPage ? <Badge variant="outline">{draftPage._status || 'draft'}</Badge> : null}
                    {dirty ? <Badge>Unsaved</Badge> : null}
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <HeaderField
                        icon={<TypeIcon className="h-4 w-4" />}
                        label="Page title"
                        onChange={(value) => {
                          setDirty(true)
                          setTitleDraft(value)
                        }}
                        placeholder="Page title"
                        value={titleDraft}
                      />
                      <HeaderField
                        icon={<Link2Icon className="h-4 w-4" />}
                        label="Slug"
                        onChange={(value) => {
                          setDirty(true)
                          setSlugDraft(value)
                        }}
                        placeholder="page-slug"
                        value={slugDraft}
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        Working page
                      </span>
                      {draftPage ? (
                        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                          <Select
                            disabled={loading || !availablePages.length}
                            onValueChange={(value) => switchToPage(Number(value))}
                            value={String(draftPage.id)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select a page" />
                            </SelectTrigger>
                            <SelectContent className="z-[130]">
                              {availablePages.map((page) => (
                                <SelectItem key={page.id} value={String(page.id)}>
                                  {page.title} ({page.visibility || 'public'})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            disabled={creatingDraftClone || loading || dirty}
                            onClick={() => void createDraftClone()}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            {creatingDraftClone ? (
                              <>
                                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <PlusIcon className="h-4 w-4" />
                                Create draft
                              </>
                            )}
                          </Button>

                          <div className="inline-flex h-10 rounded-xl border border-border/70 bg-card/50 p-1">
                            <button
                              className={`rounded-lg px-3 text-sm transition ${
                                visibilityDraft === 'public'
                                  ? 'bg-foreground text-background'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                              onClick={() => {
                                setDirty(true)
                                setVisibilityDraft('public')
                              }}
                              type="button"
                            >
                              Public
                            </button>
                            <button
                              className={`rounded-lg px-3 text-sm transition ${
                                visibilityDraft === 'private'
                                  ? 'bg-foreground text-background'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                              onClick={() => {
                                setDirty(true)
                                setVisibilityDraft('private')
                              }}
                              type="button"
                            >
                              Private
                            </button>
                          </div>

                          <Button asChild size="icon" type="button" variant="outline">
                            <a
                              aria-label="Open route preview"
                              href={pageSlugToFrontendPath(slugDraft)}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex h-10 items-center rounded-xl border border-input bg-background px-3 text-sm text-muted-foreground">
                          {loading ? 'Loading current page...' : 'No page loaded yet'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button aria-label="Dismiss page composer" onClick={composer.close} size="icon" type="button" variant="ghost">
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.3fr)_26rem]">
                <div className="min-h-0 border-r border-border/70 px-5 py-4">
                  <PageComposerPreview
                    onAddAbove={(index) => openBlockLibrary(index)}
                    onAddBelow={(index) => openBlockLibrary(index + 1)}
                    onDetachReusable={detachReusableBlock}
                    onDuplicate={duplicateBlock}
                    onPreviewModeChange={setPreviewMode}
                    onRemove={removeBlock}
                    onSelect={setSelectedIndex}
                    onToggleHidden={toggleBlockHidden}
                    onUpdateBlock={updateBlockAtIndex}
                    page={draftPage}
                    previewMode={previewMode}
                    selectedIndex={selectedIndex}
                    sharedSectionsById={sharedSectionsById}
                  />
                </div>

                <Tabs className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]" onValueChange={(value) => setActiveTab(value as ComposerTab)} value={activeTab}>
                  <div className="border-b border-border/70 px-5 py-3">
                  <TabsList className="grid h-auto w-full grid-cols-4 gap-1 rounded-xl p-1">
                    <TabsTrigger value="structure">Structure</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="publish">Publish</TabsTrigger>
                  </TabsList>
                  </div>

                  <TabsContent className="mt-0 min-h-0 overflow-y-auto px-5 py-4" value="structure">
                  {loading ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      Loading page structure...
                    </div>
                  ) : !draftPage ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      {status || 'No page is available for this route.'}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/50 px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                          {sectionSummaries.length} block{sectionSummaries.length === 1 ? '' : 's'}
                        </div>
                        <Button onClick={() => openBlockLibrary(sectionSummaries.length)} size="sm" type="button" variant="outline">
                          <PlusIcon className="h-4 w-4" />
                          Add block
                        </Button>
                      </div>

                      {sectionSummaries.length ? (
                        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
                          <SortableContext items={sectionSummaries.map((summary) => String(summary.index))} strategy={verticalListSortingStrategy}>
                            <div className="grid gap-3">
                              <StructureInsertButton onClick={() => openBlockLibrary(0)} />
                              {sectionSummaries.map((summary) => (
                                <div className="grid gap-3" key={`${summary.index}-${summary.label}`}>
                                  <SortableSectionRow
                                    active={selectedIndex === summary.index}
                                    onAddBelow={() => openBlockLibrary(summary.index + 1)}
                                    onClick={() => setSelectedIndex(summary.index)}
                                    onDuplicate={() => duplicateBlock(summary.index)}
                                    onRemove={() => removeBlock(summary.index)}
                                    onToggleHidden={() => toggleBlockHidden(summary.index)}
                                    summary={summary}
                                  />
                                  <StructureInsertButton onClick={() => openBlockLibrary(summary.index + 1)} />
                                </div>
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      ) : (
                        <div className="grid gap-3">
                          <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-4 py-8 text-sm text-muted-foreground">
                            This page does not have any blocks yet.
                          </div>
                          <StructureInsertButton onClick={() => openBlockLibrary(0)} />
                        </div>
                      )}
                    </div>
                  )}
                  </TabsContent>

                <TabsContent className="mt-0 min-h-0 overflow-y-auto px-5 py-4" value="content">
                  {loading ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      Loading section editor...
                    </div>
                  ) : !draftPage || !selectedBlock ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      Select a section from Structure first.
                    </div>
                  ) : selectedBlockIsLinkedSharedSection && selectedSharedSectionId ? (
                    <div className="grid gap-4">
                      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
                        This block is linked to a shared section source. Edit the source in the dedicated shared-section editor or detach a local copy before changing page-only content.
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button onClick={() => openSharedSectionSourceEditor(selectedSharedSectionId)} size="sm" type="button">
                            <SquarePenIcon className="h-4 w-4" />
                            Edit source
                          </Button>
                          <Button onClick={() => detachReusableBlock(selectedIndex)} size="sm" type="button" variant="outline">
                            <CopyPlusIcon className="h-4 w-4" />
                            Detach copy
                          </Button>
                          <Button onClick={() => openBlockLibrary(selectedIndex, 'replace')} size="sm" type="button" variant="outline">
                            <RefreshCwIcon className="h-4 w-4" />
                            Replace section
                          </Button>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-card/50 p-4 text-sm text-muted-foreground">
                        Publishing the shared source updates every linked published page using it. Local page overrides stay limited to placement and visibility metadata.
                      </div>
                      <ComposerNoticeList notices={composerNotices} />
                    </div>
                  ) : (selectedBlock as ReusableAwareLayoutBlock).composerReusable?.mode === 'linked' ? (
                    <div className="grid gap-4">
                      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
                        This block is using a linked reusable preset. Detach it before editing local copy, or replace it with another reusable source.
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button onClick={() => detachReusableBlock(selectedIndex)} size="sm" type="button" variant="outline">
                            <CopyPlusIcon className="h-4 w-4" />
                            Detach copy
                          </Button>
                          <Button onClick={() => openBlockLibrary(selectedIndex, 'replace')} size="sm" type="button" variant="outline">
                            <RefreshCwIcon className="h-4 w-4" />
                            Replace section
                          </Button>
                        </div>
                      </div>
                      <ComposerNoticeList notices={composerNotices} />
                    </div>
                  ) : selectedBlock.blockType === 'serviceGrid' ? (
                    <div className="grid gap-4">
                      <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-foreground">{selectedBlock.heading || 'Service section'}</div>
                              <Badge variant="outline">serviceGrid</Badge>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Edit the visible copy for this reusable section. Section media now lives in the Media tab for staff-safe swaps and generation.
                            </div>
                          </div>
                          {copilot ? (
                            <Button onClick={copilot.open} size="sm" type="button" variant="outline">
                              <SparklesIcon className="h-4 w-4" />
                              Ask copilot
                            </Button>
                          ) : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button onClick={() => openBlockLibrary(selectedIndex, 'replace')} size="sm" type="button" variant="outline">
                            <RefreshCwIcon className="h-4 w-4" />
                            Replace section
                          </Button>
                        </div>
                      </div>

                      <ComposerNoticeList notices={composerNotices} />

                      <div className="grid gap-2">
                        <label className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Block name</label>
                        <Input onChange={(event) => replaceSelectedBlock({ ...selectedBlock, blockName: event.target.value || undefined })} value={selectedBlock.blockName || ''} />
                      </div>

                      <div className="grid gap-2">
                        <label className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Display variant</label>
                        <select
                          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                          onChange={(event) =>
                            replaceSelectedBlock({
                              ...selectedBlock,
                              displayVariant: event.target.value as 'featureCards' | 'interactive' | 'pricingSteps',
                            })
                          }
                          value={selectedBlock.displayVariant || 'interactive'}
                        >
                          <option value="featureCards">Feature cards</option>
                          <option value="pricingSteps">Pricing steps</option>
                          <option value="interactive">Interactive detail</option>
                        </select>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Eyebrow</label>
                          <Input onChange={(event) => replaceSelectedBlock({ ...selectedBlock, eyebrow: event.target.value })} value={selectedBlock.eyebrow || ''} />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Heading</label>
                          <Input onChange={(event) => replaceSelectedBlock({ ...selectedBlock, heading: event.target.value })} value={selectedBlock.heading || ''} />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Intro</label>
                        <Textarea className="min-h-24" onChange={(event) => replaceSelectedBlock({ ...selectedBlock, intro: event.target.value })} value={selectedBlock.intro || ''} />
                      </div>

                      <div className="grid gap-3">
                        {(selectedBlock.services || []).map((service, serviceIndex) => (
                          <div key={`${service.name}-${serviceIndex}`} className="rounded-2xl border border-border/70 bg-card/50 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-foreground">Row {serviceIndex + 1}</div>
                              <Button
                                onClick={() =>
                                  mutateSelectedServiceGrid((block) => {
                                    const services = [...(block.services || [])]
                                    services.splice(serviceIndex, 1)
                                    return { ...block, services }
                                  })
                                }
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                <Trash2Icon className="h-4 w-4" />
                                Remove
                              </Button>
                            </div>

                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <Input
                                onChange={(event) => mutateSelectedService(serviceIndex, (current) => ({ ...current, name: event.target.value }))}
                                placeholder="Name"
                                value={service.name || ''}
                              />
                              <Input
                                onChange={(event) => mutateSelectedService(serviceIndex, (current) => ({ ...current, eyebrow: event.target.value }))}
                                placeholder="Eyebrow"
                                value={service.eyebrow || ''}
                              />
                            </div>

                            <div className="mt-3 grid gap-3">
                              <Textarea
                                className="min-h-20"
                                onChange={(event) => mutateSelectedService(serviceIndex, (current) => ({ ...current, summary: event.target.value }))}
                                placeholder="Summary"
                                value={service.summary || ''}
                              />
                              <Input
                                onChange={(event) => mutateSelectedService(serviceIndex, (current) => ({ ...current, pricingHint: event.target.value }))}
                                placeholder="Pricing hint"
                                value={service.pricingHint || ''}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() =>
                          mutateSelectedServiceGrid((block) => ({
                            ...block,
                            services: [
                              ...(block.services || []),
                              {
                                eyebrow: 'New row',
                                highlights: [{ text: 'Replace this default proof point.' }],
                                name: 'New item',
                                pricingHint: '',
                                summary: 'Describe this row.',
                              },
                            ],
                          }))
                        }
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add row
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
                        <div className="text-sm font-semibold text-foreground">{sectionSummaries[selectedIndex]?.label || 'Selected block'}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          This first content editor is focused on reusable `serviceGrid` sections. Other block types can still be replaced, reordered, duplicated, and removed while the shared-section authoring surface expands.
                        </div>
                        <div className="mt-3">
                          <Button onClick={() => openBlockLibrary(selectedIndex, 'replace')} size="sm" type="button" variant="outline">
                            <RefreshCwIcon className="h-4 w-4" />
                            Replace section
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent className="mt-0 min-h-0 overflow-y-auto px-5 py-4" value="media">
                  {loading ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      Loading section media...
                    </div>
                  ) : !draftPage || !selectedBlock ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      Select a section from Structure first.
                    </div>
                  ) : !selectedServiceGrid ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      This first media editor is focused on `serviceGrid` rows. Other media relationships still use the existing page media tools while the unified composer expands.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-foreground">{selectedServiceGrid.heading || 'Service section'}</div>
                          <Badge variant="outline">serviceGrid media</Badge>
                          <Badge variant="secondary">{mediaSlots.length} slots</Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Choose a row, then upload, generate, or swap from recent media without leaving the page.
                        </div>
                      </div>

                      {dirty ? (
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100">
                          Save draft before changing media. Media actions run against the persisted draft layout so relation paths stay aligned with the current section structure.
                        </div>
                      ) : null}

                      <div className="grid gap-3">
                        {mediaSlots.map((slot) => (
                          <button
                            key={slot.relationPath}
                            className={`rounded-2xl border p-3 text-left transition ${
                              selectedMediaSlot?.relationPath === slot.relationPath
                                ? 'border-primary/60 bg-primary/5'
                                : 'border-border/70 bg-card/50 hover:border-primary/30'
                            }`}
                            onClick={() => {
                              setSelectedMediaPath(slot.relationPath)
                              setMediaKind(getMediaKindFromMimeType(slot.media?.mimeType))
                            }}
                            type="button"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{slot.label}</span>
                              {slot.mediaId ? <Badge variant="secondary">ID {slot.mediaId}</Badge> : null}
                              <Badge variant="outline">{slot.relationPath}</Badge>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">{slot.media?.filename || 'No media assigned yet.'}</div>
                          </button>
                        ))}
                      </div>

                      {selectedMediaSlot ? (
                        <>
                          <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/50">
                              {selectedMediaSlot.media?.previewUrl ? (
                                getMediaKindFromMimeType(selectedMediaSlot.media.mimeType) === 'video' ? (
                                  <video className="aspect-video h-full w-full bg-black object-cover" controls muted playsInline src={selectedMediaSlot.media.previewUrl} />
                                ) : (
                                  <img
                                    alt={selectedMediaSlot.media.alt || selectedMediaSlot.label}
                                    className="aspect-video h-full w-full object-cover"
                                    src={selectedMediaSlot.media.previewUrl}
                                  />
                                )
                              ) : (
                                <div className="flex aspect-video items-center justify-center bg-muted/40 text-muted-foreground">
                                  <div className="flex items-center gap-2 text-sm">
                                    <ImageIcon className="h-4 w-4" />
                                    No media assigned
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="grid gap-3 rounded-3xl border border-border/70 bg-card/50 p-4">
                              <div>
                                <div className="text-sm font-semibold text-foreground">{selectedMediaSlot.label}</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {selectedMediaSlot.media?.alt || 'Use upload, generate, or recent-library swap to fill this row.'}
                                </div>
                              </div>
                              <div className="grid gap-2 text-xs text-muted-foreground">
                                <div>
                                  Current file: <span className="text-foreground">{selectedMediaSlot.media?.filename || 'None'}</span>
                                </div>
                                <div>
                                  Last updated: <span className="text-foreground">{formatTimestamp(selectedMediaSlot.media?.updatedAt)}</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button onClick={() => setMediaKind('image')} size="sm" type="button" variant={mediaKind === 'image' ? 'default' : 'outline'}>
                                  Image
                                </Button>
                                <Button onClick={() => setMediaKind('video')} size="sm" type="button" variant={mediaKind === 'video' ? 'default' : 'outline'}>
                                  Video
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-3xl border border-border/70 bg-card/50 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-foreground">Upload or generate</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Upload a file directly or generate a new {mediaKind} for this selected service row.
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {copilot ? (
                                  <Button
                                    disabled={mediaActionsLocked}
                                    onClick={() =>
                                      copilot.openFocusedMediaSession({
                                        mode: mediaKind,
                                        promptHint: mediaPrompt,
                                      })
                                    }
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    <SparklesIcon className="h-4 w-4" />
                                    Focused copilot
                                  </Button>
                                ) : null}
                                <Button disabled={mediaLoading} onClick={() => void loadMediaLibrary()} size="sm" type="button" variant="ghost">
                                  <RefreshCwIcon className={`h-4 w-4 ${mediaLoading ? 'animate-spin' : ''}`} />
                                  Refresh library
                                </Button>
                              </div>
                            </div>

                            <input
                              accept={mediaKind === 'video' ? 'video/*' : 'image/*'}
                              className="hidden"
                              ref={mediaUploadInputRef}
                              type="file"
                              onChange={async (event) => {
                                const file = event.target.files?.[0]
                                if (!file || !selectedMediaSlot) return
                                await submitMediaAction({
                                  action: 'create-and-swap',
                                  file,
                                  relationPath: selectedMediaSlot.relationPath,
                                  success: `Updated ${selectedMediaSlot.label}.`,
                                })
                                event.currentTarget.value = ''
                              }}
                            />

                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button disabled={mediaActionsLocked || submittingMediaAction !== null} onClick={() => mediaUploadInputRef.current?.click()} size="sm" type="button" variant="secondary">
                                {submittingMediaAction === 'create-and-swap' ? (
                                  <>
                                    <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <UploadIcon className="h-4 w-4" />
                                    Upload and swap
                                  </>
                                )}
                              </Button>
                              <Button
                                disabled={mediaActionsLocked || submittingMediaAction !== null || !mediaPrompt.trim()}
                                onClick={() => {
                                  if (!selectedMediaSlot) return
                                  void submitMediaAction({
                                    action: 'generate-and-swap',
                                    mediaId: selectedMediaSlot.mediaId,
                                    prompt: mediaPrompt,
                                    relationPath: selectedMediaSlot.relationPath,
                                    success: `Generated new ${mediaKind} for ${selectedMediaSlot.label}.`,
                                  })
                                }}
                                size="sm"
                                type="button"
                              >
                                {submittingMediaAction === 'generate-and-swap' ? (
                                  <>
                                    <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <SparklesIcon className="h-4 w-4" />
                                    Generate and swap
                                  </>
                                )}
                              </Button>
                            </div>

                            <div className="mt-4 grid gap-2">
                              <label className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground" htmlFor={mediaPromptId}>
                                Prompt
                              </label>
                              <Textarea
                                className="min-h-24"
                                id={mediaPromptId}
                                onChange={(event) => setMediaPrompt(event.target.value)}
                                placeholder={`Describe the ${mediaKind} for ${selectedMediaSlot.label.toLowerCase()}...`}
                                value={mediaPrompt}
                              />
                            </div>
                          </div>

                          <div className="rounded-3xl border border-border/70 bg-card/50 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-foreground">Recent media</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Reuse a recent media record for this row instead of creating a duplicate asset.
                                </div>
                              </div>
                              <Badge variant="outline">{mediaLibrary.length} records</Badge>
                            </div>

                            <div className="mt-4 grid gap-3">
                              {mediaLoading ? (
                                <div className="rounded-2xl border border-border/70 bg-background px-4 py-6 text-sm text-muted-foreground">
                                  Loading media library...
                                </div>
                              ) : mediaLibrary.length ? (
                                mediaLibrary.slice(0, 12).map((item) => (
                                  <div key={item.id} className="grid gap-3 rounded-2xl border border-border/70 bg-background p-3 md:grid-cols-[5rem_minmax(0,1fr)_auto]">
                                    <div className="overflow-hidden rounded-2xl bg-muted/40">
                                      {item.previewUrl ? (
                                        getMediaKindFromMimeType(item.mimeType) === 'video' ? (
                                          <video className="aspect-square h-full w-full object-cover" muted playsInline src={item.previewUrl} />
                                        ) : (
                                          <img alt={item.alt || item.filename || `Media ${item.id}`} className="aspect-square h-full w-full object-cover" src={item.previewUrl} />
                                        )
                                      ) : (
                                        <div className="flex aspect-square items-center justify-center text-muted-foreground">
                                          <ImageIcon className="h-4 w-4" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <div className="truncate text-sm font-semibold text-foreground">{item.alt || item.filename || `Media ${item.id}`}</div>
                                        <Badge variant="secondary">ID {item.id}</Badge>
                                      </div>
                                      <div className="mt-1 text-xs text-muted-foreground">{item.filename || 'Untitled media'} · {formatTimestamp(item.updatedAt)}</div>
                                    </div>
                                    <Button
                                      disabled={mediaActionsLocked || submittingMediaAction !== null}
                                      onClick={() => {
                                        if (!selectedMediaSlot) return
                                        void submitMediaAction({
                                          action: 'swap-existing-reference',
                                          mediaId: item.id,
                                          relationPath: selectedMediaSlot.relationPath,
                                          success: `Swapped ${selectedMediaSlot.label} to media ${item.id}.`,
                                        })
                                      }}
                                      size="sm"
                                      type="button"
                                      variant="outline"
                                    >
                                      Use this media
                                    </Button>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-2xl border border-border/70 bg-background px-4 py-6 text-sm text-muted-foreground">
                                  No media records are available yet.
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  )}
                </TabsContent>

                <TabsContent className="mt-0 min-h-0 overflow-y-auto px-5 py-4" value="publish">
                  {loading ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      Loading publish controls...
                    </div>
                  ) : !draftPage ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      No page is available for this route.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-foreground">{draftPage.title}</div>
                          <Badge variant="outline">{draftPage._status || 'draft'}</Badge>
                          <Badge variant="secondary">{draftPage.visibility || 'public'}</Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Updated {formatTimestamp(draftPage.updatedAt)} · Published {formatTimestamp(draftPage.publishedAt)}
                        </div>
                      </div>

                      <ComposerNoticeList notices={composerNotices} />

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
                          <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Route</div>
                          <div className="mt-2 text-sm font-semibold text-foreground">
                            {pageSlugToFrontendPath(slugDraft)}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {visibilityDraft === 'private'
                              ? 'Private until you change visibility.'
                              : 'Public when published.'}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
                          <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Current draft</div>
                          <div className="mt-2 text-sm font-semibold text-foreground">
                            {dirty ? 'Unsaved changes ready to review.' : 'Draft matches the last saved state.'}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {sectionSummaries.length} block{sectionSummaries.length === 1 ? '' : 's'} in this page · {changedBlockCount} changed block{changedBlockCount === 1 ? '' : 's'}.
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Publish review</div>
                            <div className="mt-2 text-sm font-semibold text-foreground">
                              {validationSummary?.pageStatus === 'published' ? 'Published page with active draft edits' : 'Draft page'}
                            </div>
                          </div>
                          <Badge variant={validationSummary?.issues.length ? 'outline' : 'secondary'}>
                            {validationSummary?.issues.length || 0} validation issue{validationSummary?.issues.length === 1 ? '' : 's'}
                          </Badge>
                        </div>

                        {validationSummary?.issues.length ? (
                          <div className="mt-4 grid gap-2">
                            {validationSummary.issues.map((issue) => (
                              <div
                                className={`rounded-2xl border px-3 py-3 text-sm ${
                                  issue.tone === 'warning'
                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100'
                                    : 'border-border/70 bg-background/70 text-muted-foreground'
                                }`}
                                key={issue.id}
                              >
                                {issue.blockIndex !== null ? `Block ${issue.blockIndex + 1}: ` : ''}
                                {issue.message}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-3 text-sm text-muted-foreground">
                            Validation is clear for the currently supported composer checks.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <div className="border-t border-border/70 px-5 py-4">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div className="text-sm text-muted-foreground">{footerStatus}</div>
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={!draftPage || savingAction !== null} onClick={() => void persistPage('save-draft')} size="sm" type="button" variant="outline">
                        {savingAction === 'save-draft' ? (
                          <>
                            <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <SquarePenIcon className="h-4 w-4" />
                            Save draft
                          </>
                        )}
                      </Button>
                      <Button disabled={!draftPage || savingAction !== null} onClick={() => void persistPage('publish-page')} size="sm" type="button">
                        {savingAction === 'publish-page' ? (
                          <>
                            <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <RocketIcon className="h-4 w-4" />
                            Publish
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Tabs>
              </div>

              {isBlockLibraryOpen ? (
                <div className="absolute inset-0 z-[130] bg-background/98 backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-semibold text-foreground">Block library</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {blockLibraryMode === 'replace'
                          ? `Replace block ${Math.max(1, (blockLibraryTargetIndex ?? 0) + 1)} with another layout, preset, or shared source.`
                          : `Insert a block at position ${(blockLibraryTargetIndex ?? 0) + 1}.`}
                      </div>
                    </div>
                    <Button
                      aria-label="Close block library"
                      onClick={() => {
                        setIsBlockLibraryOpen(false)
                        setBlockLibraryTargetIndex(null)
                      }}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid h-[calc(100%-5.5rem)] grid-rows-[auto_minmax(0,1fr)] gap-4 px-5 py-4">
                    <Input
                      onChange={(event) => setBlockLibraryQuery(event.target.value)}
                      placeholder="Search blocks"
                      value={blockLibraryQuery}
                    />

                    <div className="overflow-y-auto">
                      <div className="grid gap-5">
                        {filteredBlockDefinitions.length ? (
                          <section className="grid gap-3">
                            <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                              Layouts
                            </div>
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
                                  onClick={() =>
                                    definition.supportsInsert
                                      ? insertRegisteredBlock(definition.type as PageComposerInsertableBlockType)
                                      : undefined
                                  }
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
                            <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                              Sections
                            </div>
                            <div className="grid gap-3">
                              {filteredReusablePresets.map((preset) => (
                                  <div className="rounded-2xl border border-border/70 bg-card/50 p-4" key={preset.key}>
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
                            <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                              Shared sections
                            </div>
                            {sharedSectionsLoading ? <Badge variant="outline">Loading</Badge> : null}
                          </div>

                          {sharedSectionsStatus ? (
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
                              {sharedSectionsStatus}
                            </div>
                          ) : null}

                          {filteredSharedSections.length ? (
                            <div className="grid gap-3">
                              {filteredSharedSections.map((item) => (
                                <div className="rounded-2xl border border-border/70 bg-card/50 p-4" key={`shared-${item.id}`}>
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
                            <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                              Loading published shared sections...
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                              No published shared sections match that search yet.
                            </div>
                          )}
                        </section>

                        {!filteredBlockDefinitions.length && !filteredReusablePresets.length && !filteredSharedSections.length ? (
                          <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                            No layouts, presets, or shared sections match that search.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
