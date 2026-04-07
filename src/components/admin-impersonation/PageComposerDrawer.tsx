'use client'
/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { usePathname, useRouter } from 'next/navigation'
import { motion, useDragControls } from 'motion/react'
import {
  CopyPlusIcon,
  EyeIcon,
  EyeOffIcon,
  FilePenLineIcon,
  GripVerticalIcon,
  HistoryIcon,
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
  Undo2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  PAGE_COMPOSER_TOOLBAR_EVENT,
  usePageComposerOptional,
  type PageComposerTab,
  type PageComposerToolbarState,
} from '@/components/admin-impersonation/PageComposerContext'
import { usePortalCopilotOptional } from '@/components/copilot/PortalCopilotContext'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { buildMediaDevtoolsSummary, type MediaDevtoolsSummary } from '@/lib/media/pageMediaDevtools'
import { isUnknownRecord } from '@/lib/is-unknown-record'
import {
  buildPageComposerValidationSummary,
  buildPageComposerNotices,
  buildPageComposerSectionSummaries,
  countPageComposerChangedBlocks,
  duplicatePageLayoutSection,
  frontendPathToPageSlug,
  insertPageLayoutRegisteredBlock,
  pageSlugToFrontendPath,
  removePageLayoutSection,
  togglePageLayoutSectionHidden,
  type PageComposerDocument,
  type PageComposerNotice,
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
  pages?: PageComposerPageSummary[]
  versions?: PageComposerVersionSummary[]
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
  return isUnknownRecord(value) ? (value as Media) : null
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

function formatComposerBreadcrumbs(pagePath: string) {
  if (pagePath === '/') {
    return ['Home']
  }

  return pagePath
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/-/g, ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
}

function ComposerAdminBar({
  availablePages,
  creatingDraftClone,
  dirty,
  draftPage,
  loading,
  onCreateDraft,
  onSetSlugDraft,
  onSetTitleDraft,
  onSetVisibilityDraft,
  slugDraft,
  switchToPage,
  titleDraft,
  visibilityDraft,
}: {
  availablePages: PageComposerPageSummary[]
  creatingDraftClone: boolean
  dirty: boolean
  draftPage: null | PageComposerDocument
  loading: boolean
  onCreateDraft: () => void
  onSetSlugDraft: (value: string) => void
  onSetTitleDraft: (value: string) => void
  onSetVisibilityDraft: (value: 'private' | 'public') => void
  slugDraft: string
  switchToPage: (pageId: number) => void
  titleDraft: string
  visibilityDraft: 'private' | 'public'
}) {
  const breadcrumbs = formatComposerBreadcrumbs(draftPage?.pagePath || '/')

  return (
    <div className="border-b border-border/70 bg-card/35 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            <span>Composer admin bar</span>
            {breadcrumbs.map((segment, index) => (
              <span className="inline-flex items-center gap-2" key={`${segment}-${index}`}>
                <span>/</span>
                <span>{segment}</span>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {draftPage ? <Badge variant="secondary">{draftPage.pagePath}</Badge> : null}
            {draftPage ? <Badge variant="outline">{draftPage._status || 'draft'}</Badge> : null}
            {dirty ? <Badge>Unsaved</Badge> : null}
          </div>
        </div>
        <div className="min-w-[14rem] flex-1 md:max-w-sm">
          {draftPage ? (
            <Select
              disabled={loading || !availablePages.length}
              onValueChange={(value) => switchToPage(Number(value))}
              value={String(draftPage.id)}
            >
              <SelectTrigger className="h-10 bg-background/90">
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
          ) : (
            <div className="flex h-10 items-center rounded-xl border border-input bg-background px-3 text-sm text-muted-foreground">
              {loading ? 'Loading current page...' : 'No page loaded yet'}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto_auto]">
        <HeaderField
          icon={<TypeIcon className="h-4 w-4" />}
          label="Page title"
          onChange={onSetTitleDraft}
          placeholder="Page title"
          value={titleDraft}
        />
        <HeaderField
          icon={<Link2Icon className="h-4 w-4" />}
          label="Slug"
          onChange={onSetSlugDraft}
          placeholder="page-slug"
          value={slugDraft}
        />

        <Button
          className="mt-[1.45rem] h-10"
          disabled={creatingDraftClone || loading || dirty}
          onClick={onCreateDraft}
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

        <div className="mt-[1.45rem] inline-flex h-10 rounded-xl border border-border/70 bg-card/50 p-1">
          <button
            className={`rounded-lg px-3 text-sm transition ${
              visibilityDraft === 'public'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onSetVisibilityDraft('public')}
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
            onClick={() => onSetVisibilityDraft('private')}
            type="button"
          >
            Private
          </button>
        </div>

        <Button asChild className="mt-[1.45rem] h-10 w-10" size="icon" type="button" variant="outline">
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
    </div>
  )
}

function StructureInsertButton({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <button
      aria-label="Add block"
      className="group relative flex h-7 w-full items-center justify-center"
      onClick={onClick}
      type="button"
    >
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border/70 transition group-hover:bg-primary/40" />
      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground shadow-sm transition group-hover:border-primary/40 group-hover:bg-primary/5 group-hover:text-foreground">
        <PlusIcon className="h-4 w-4" />
      </span>
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
  const isHeroSummary = summary.blockType === 'hero'
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: String(summary.index),
    disabled: isHeroSummary,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border p-3 transition ${
        active ? 'border-primary/60 bg-primary/5' : 'border-border/70 bg-card/50'
      } ${summary.hidden ? 'opacity-75' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          className="mt-0.5 rounded-lg border border-border/70 bg-background p-2 text-muted-foreground disabled:cursor-default disabled:opacity-50"
          disabled={isHeroSummary}
          type="button"
          {...attributes}
          {...listeners}
        >
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
          <Button aria-label={`Add block below ${summary.label}`} onClick={onAddBelow} size="icon" type="button" variant="ghost">
            <PlusIcon className="h-4 w-4" />
          </Button>
          {!isHeroSummary ? (
            <>
              <Button
                aria-label={`${summary.hidden ? 'Show' : 'Hide'} block ${summary.label}`}
                onClick={onToggleHidden}
                size="icon"
                type="button"
                variant="ghost"
              >
                {summary.hidden ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
              </Button>
              <Button onClick={onDuplicate} size="icon" type="button" variant="ghost">
                <CopyPlusIcon className="h-4 w-4" />
              </Button>
              <Button onClick={onRemove} size="icon" type="button" variant="ghost">
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </>
          ) : null}
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
  const footerStatus = status || mediaStatus || 'Page edits stay local until you save or publish.'
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
      const resolvedPath = frontendPathToPageSlug(requestedPath) ? requestedPath : '/'
      const query = args?.pageId
        ? `pageId=${args.pageId}`
        : `pagePath=${encodeURIComponent(resolvedPath)}`

      setLoading(true)
      setStatus(null)

      try {
        const response = await fetch(`/api/internal/page-composer?${query}`)
        const payload = (await response.json().catch(() => null)) as null | PageComposerResponse

        if (!response.ok || !payload?.page) {
          throw new Error(payload?.error || 'Unable to load the page composer.')
        }

        setAvailablePages(payload.pages || [])
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
          slug: slugDraft.trim(),
          title: titleDraft.trim(),
          visibility: visibilityDraft,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      const payload = (await response.json().catch(() => null)) as null | PageComposerResponse
      if (!response.ok || !payload?.page) throw new Error(payload?.error || 'Unable to save the page.')
      setAvailablePages(payload.pages || [])
      setDraftPage(payload.page)
      setPageVersions(payload.versions || [])
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

  const createDraftClone = useCallback(async () => {
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
      const payload = (await response.json().catch(() => null)) as null | PageComposerResponse

      if (!response.ok || !payload?.page) {
        throw new Error(payload?.error || 'Unable to create the page draft.')
      }

      setAvailablePages(payload.pages || [])
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
    if (!draftPage) return

    const confirmed =
      typeof window === 'undefined'
        ? true
        : window.confirm(
            `Restore ${version.title} from ${formatTimestamp(version.updatedAt)} as the current draft? Unsaved page edits will be replaced.`,
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
      const payload = (await response.json().catch(() => null)) as null | PageComposerResponse

      if (!response.ok || !payload?.page) {
        throw new Error(payload?.error || 'Unable to restore the page version.')
      }

      setAvailablePages(payload.pages || [])
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

  const switchToPage = useCallback((pageId: number) => {
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
  }, [availablePages, dirty, loadPage, router, setSelectedIndex])

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
      embedded && open && draftPage && composerActivePagePath === pathname
        ? {
            availablePages,
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
            switchToPage,
            titleDraft,
            visibilityDraft,
          }
        : null

    window.dispatchEvent(new CustomEvent(PAGE_COMPOSER_TOOLBAR_EVENT, { detail }))

    return () => {
      window.dispatchEvent(new CustomEvent(PAGE_COMPOSER_TOOLBAR_EVENT, { detail: null }))
    }
  }, [
    availablePages,
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
    switchToPage,
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
        <div className="flex items-center justify-between gap-4 border-b border-border/70 px-5 py-4">
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
              <p className="text-[0.68rem] uppercase tracking-[0.3em] text-muted-foreground">Staff beta</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">Visual composer</h2>
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
        {showInlineAdminBar ? (
          <ComposerAdminBar
            availablePages={availablePages}
            creatingDraftClone={creatingDraftClone}
            dirty={dirty}
            draftPage={draftPage}
            loading={loading}
            onCreateDraft={() => void createDraftClone()}
            onSetSlugDraft={(value) => {
              setDirty(true)
              setSlugDraft(value)
            }}
            onSetTitleDraft={(value) => {
              setDirty(true)
              setTitleDraft(value)
            }}
            onSetVisibilityDraft={(value) => {
              setDirty(true)
              setVisibilityDraft(value)
            }}
            slugDraft={slugDraft}
            switchToPage={switchToPage}
            titleDraft={titleDraft}
            visibilityDraft={visibilityDraft}
          />
        ) : null}

        <Tabs
          className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden"
          onValueChange={(value) => setActiveTab(value as PageComposerTab)}
          value={activeTab}
        >
          {showInlineAdminBar ? (
            <div className="border-b border-border/70 px-5 py-3">
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
                              {heroSummary ? (
                                <div className="grid gap-3">
                                  <SortableSectionRow
                                    active={selectedIndex === heroSummary.index}
                                    onAddBelow={() => openBlockLibrary(0)}
                                    onClick={() => setSelectedIndex(heroSummary.index)}
                                    onDuplicate={() => {}}
                                    onRemove={() => {}}
                                    onToggleHidden={() => {}}
                                    summary={heroSummary}
                                  />
                                  <StructureInsertButton onClick={() => openBlockLibrary(0)} />
                                </div>
                              ) : (
                                <StructureInsertButton onClick={() => openBlockLibrary(0)} />
                              )}
                              {layoutSectionSummaries.map((summary) => (
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
                            This page does not have any layout blocks yet.
                          </div>
                          <StructureInsertButton onClick={() => openBlockLibrary(0)} />
                        </div>
                      )}
                    </div>
                  )}
                  </TabsContent>

                <TabsContent className="portal-scroll mt-0 min-h-0 px-5 py-4" value="content">
                  {loading ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      Loading section editor...
                    </div>
                  ) : !draftPage ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      No page is available for this route.
                    </div>
                  ) : selectedIndex < 0 ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      Hero copy and hero media edit directly on the live canvas. Click the hero content on the page to update it inline.
                    </div>
                  ) : !selectedBlock ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      Select a section on the live page to edit its content.
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
                          <Button onClick={() => removeBlock(selectedIndex)} size="sm" type="button" variant="outline">
                            <Trash2Icon className="h-4 w-4" />
                            Remove from page
                          </Button>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-card/50 p-4 text-sm text-muted-foreground">
                        Publishing the shared source updates every linked published page using it. Removing this section here only removes this page instance. The source itself stays intact.
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
                          <Button onClick={() => removeBlock(selectedIndex)} size="sm" type="button" variant="outline">
                            <Trash2Icon className="h-4 w-4" />
                            Remove from page
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
                        <div className="text-sm font-semibold text-foreground">{selectedSummary?.label || 'Selected block'}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {selectedIndex < 0
                            ? 'Hero editing now happens directly on the page. Use the live canvas copy and media affordances instead of this side surface.'
                            : 'This first content editor is focused on reusable `serviceGrid` sections. Other block types can still be replaced, reordered, duplicated, and removed while the shared-section authoring surface expands.'}
                        </div>
                        <div className="mt-3">
                          <Button
                            disabled={selectedIndex < 0}
                            onClick={() => openBlockLibrary(selectedIndex, 'replace')}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <RefreshCwIcon className="h-4 w-4" />
                            Replace section
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent className="portal-scroll mt-0 min-h-0 px-5 py-4" value="media">
                  {loading ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      Loading section media...
                    </div>
                  ) : !draftPage ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      No page is available for this route.
                    </div>
                  ) : selectedIndex < 0 ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      Hero media swaps and generation live directly on the canvas. Hover the hero image on the page to replace or generate media.
                    </div>
                  ) : !selectedBlock ? (
                    <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                      Select a section on the live page to edit its media.
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

                <TabsContent className="portal-scroll mt-0 min-h-0 px-5 py-4" value="publish">
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

                      <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                              <HistoryIcon className="h-3.5 w-3.5" />
                              Version history
                            </div>
                            <div className="mt-2 text-sm font-semibold text-foreground">
                              Restore an earlier snapshot into draft state
                            </div>
                          </div>
                          <Badge variant="outline">
                            {pageVersions.length} version{pageVersions.length === 1 ? '' : 's'}
                          </Badge>
                        </div>

                        {pageVersions.length ? (
                          <div className="mt-4 grid gap-3">
                            {pageVersions.map((version) => (
                              <div className="rounded-2xl border border-border/70 bg-background/70 p-3" key={version.id}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="grid gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-semibold text-foreground">{version.title}</span>
                                      <Badge variant={version.status === 'published' ? 'secondary' : 'outline'}>
                                        {version.status}
                                      </Badge>
                                      {version.latest ? <Badge variant="outline">Current draft</Badge> : null}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {version.pagePath} · Saved {formatTimestamp(version.updatedAt)}
                                    </div>
                                  </div>

                                  <Button
                                    disabled={savingAction !== null || restoringVersionId !== null}
                                    onClick={() => void restorePageVersion(version)}
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    {restoringVersionId === version.id ? (
                                      <>
                                        <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                                        Restoring...
                                      </>
                                    ) : (
                                      <>
                                        <Undo2Icon className="h-4 w-4" />
                                        Restore draft
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-3 text-sm text-muted-foreground">
                            Save or publish this page to start building version history.
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
                      <Button disabled={!draftPage || savingAction !== null || restoringVersionId !== null} onClick={() => void persistPage('save-draft')} size="sm" type="button" variant="outline">
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
                      <Button disabled={!draftPage || savingAction !== null || restoringVersionId !== null} onClick={() => void persistPage('publish-page')} size="sm" type="button">
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

        {isBlockLibraryOpen ? (
          <div className="fixed right-4 top-[calc(var(--portal-sticky-top)+4.75rem)] z-[120] h-[min(42rem,calc(100vh-7rem))] w-[min(31rem,calc(100vw-1rem))] overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/98 shadow-2xl backdrop-blur-sm">
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
