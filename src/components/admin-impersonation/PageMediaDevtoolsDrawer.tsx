'use client'

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ImageIcon,
  LoaderCircleIcon,
  PencilLineIcon,
  SparklesIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { usePageMediaDevtoolsOptional } from '@/components/admin-impersonation/PageMediaDevtoolsContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utilities/ui'

type DrawerAction =
  | 'create-and-swap'
  | 'create-only'
  | 'generate-and-swap'
  | 'generate-only'
  | 'generate-replace-existing'
  | 'replace-existing'
  | 'swap-existing-reference'

type MediaLibraryItem = {
  alt: null | string
  filename: null | string
  id: number
  mimeType: null | string
  previewUrl: null | string
  updatedAt: string
}

function buildDuplicateMap(mediaIds: Array<null | number>) {
  const counts = new Map<number, number>()

  for (const mediaId of mediaIds) {
    if (mediaId == null) {
      continue
    }

    counts.set(mediaId, (counts.get(mediaId) || 0) + 1)
  }

  return counts
}

function formatUpdatedAt(value: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

function buildAltFromPrompt(prompt: string, fallback: string) {
  const trimmed = prompt.trim()
  return (trimmed || fallback).slice(0, 240)
}

function buildAltFromFilename(filename: null | string | undefined, fallback: string) {
  return (filename?.replace(/\.[a-z0-9]+$/i, '') || fallback).slice(0, 240)
}

function getFileKind(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

function getMediaKindFromMimeType(mimeType: null | string | undefined): 'image' | 'video' {
  return mimeType?.startsWith('video/') ? 'video' : 'image'
}

type UploadSurfaceProps = {
  actions?: ReactNode
  badges?: ReactNode
  children?: ReactNode
  description?: ReactNode
  emptyLabel?: string
  onClick?: () => void
  onDropFile?: (file: File) => Promise<void> | void
  previewMimeType?: null | string
  previewUrl?: null | string
  selected?: boolean
  title: string
}

function UploadSurface({
  actions,
  badges,
  children,
  description,
  emptyLabel = 'No preview available',
  onClick,
  onDropFile,
  previewMimeType,
  previewUrl,
  selected = false,
  title,
}: UploadSurfaceProps) {
  const [dragActive, setDragActive] = useState(false)

  return (
    <div
      className={cn(
        'rounded-[1.35rem] border border-border/70 bg-card/52 p-4 transition',
        selected && 'border-primary/60 bg-primary/5 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]',
        dragActive && 'border-primary/60 bg-primary/6 ring-2 ring-primary/18',
        onClick && 'cursor-pointer hover:border-primary/40 hover:bg-primary/5',
      )}
      onClick={onClick}
      onDragEnter={(event) => {
        if (!onDropFile) return
        event.preventDefault()
        setDragActive(true)
      }}
      onKeyDown={(event) => {
        if (!onClick) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
      onDragLeave={(event) => {
        if (!onDropFile) return
        event.preventDefault()
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
          return
        }
        setDragActive(false)
      }}
      onDragOver={(event) => {
        if (!onDropFile) return
        event.preventDefault()
        if (!dragActive) {
          setDragActive(true)
        }
      }}
      onDrop={async (event) => {
        if (!onDropFile) return
        event.preventDefault()
        setDragActive(false)
        const file = event.dataTransfer.files?.[0]

        if (file) {
          await onDropFile(file)
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          {description ? <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</div> : null}
        </div>
        {badges ? <div className="flex shrink-0 flex-wrap justify-end gap-2">{badges}</div> : null}
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-border/70 bg-muted">
        {previewUrl ? (
          getMediaKindFromMimeType(previewMimeType) === 'video' ? (
            <video autoPlay className="aspect-[16/10] w-full object-cover" loop muted playsInline src={previewUrl} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={title} className="aspect-[16/10] w-full object-cover" src={previewUrl} />
          )
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2 text-center">
              <ImageIcon className="h-5 w-5" />
              <span className="text-xs">{emptyLabel}</span>
            </div>
          </div>
        )}
        {dragActive ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/88 backdrop-blur-sm">
            <div className="rounded-full border border-primary/40 bg-primary/8 px-4 py-2 text-sm font-medium text-foreground">
              Drop image to apply
            </div>
          </div>
        ) : null}
      </div>

      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  )
}

export function PageMediaDevtoolsDrawer({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  const context = usePageMediaDevtoolsOptional()
  const currentPage = context?.currentPage || null
  const entries = useMemo(() => currentPage?.entries || [], [currentPage])
  const [activeTab, setActiveTab] = useState<'library' | 'page'>('page')
  const [libraryItems, setLibraryItems] = useState<MediaLibraryItem[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [pagePrompt, setPagePrompt] = useState('')
  const [pageEditorOpen, setPageEditorOpen] = useState(false)
  const [pageEditorTab, setPageEditorTab] = useState<'gallery' | 'image' | 'video'>('image')
  const [libraryPrompt, setLibraryPrompt] = useState('')
  const [libraryPromptOpen, setLibraryPromptOpen] = useState(false)
  const [libraryPromptKind, setLibraryPromptKind] = useState<'image' | 'video'>('image')
  const [selectedLibraryId, setSelectedLibraryId] = useState<null | number>(null)
  const [selectedPath, setSelectedPath] = useState<null | string>(null)
  const [status, setStatus] = useState<null | string>(null)
  const [submittingAction, setSubmittingAction] = useState<null | DrawerAction>(null)
  const libraryCreateInputRef = useRef<HTMLInputElement | null>(null)
  const pageUploadInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!entries.length) {
      setSelectedPath(null)
      return
    }

    setSelectedPath((current) =>
      current && entries.some((entry) => entry.relationPath === current) ? current : entries[0]?.relationPath || null,
    )
  }, [entries])

  const loadLibrary = useCallback(async (preserveSelection = true) => {
    if (!open) {
      return
    }

    setLibraryLoading(true)

    try {
      const response = await fetch('/api/internal/dev/page-media', { method: 'GET' })
      const payload = (await response.json().catch(() => null)) as null | {
        error?: string
        items?: MediaLibraryItem[]
      }

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to load local media records.')
      }

      const items = payload?.items || []
      setLibraryItems(items)
      setSelectedLibraryId((current) => {
        if (!preserveSelection) {
          return items[0]?.id || null
        }

        return current && items.some((item) => item.id === current) ? current : items[0]?.id || null
      })
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to load local media records.')
    } finally {
      setLibraryLoading(false)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      void loadLibrary()
    }
  }, [loadLibrary, open])

  const duplicates = useMemo(() => buildDuplicateMap(entries.map((entry) => entry.mediaId)), [entries])
  const selectedEntry = entries.find((entry) => entry.relationPath === selectedPath) || entries[0] || null

  function closePageEditor() {
    setPageEditorOpen(false)
    setPagePrompt('')
  }

  function openPageEditor(entry: (typeof entries)[number], tab: 'gallery' | 'image' | 'video' = 'image') {
    setSelectedPath(entry.relationPath)
    setPageEditorOpen(true)
    setPageEditorTab(tab)
    setPagePrompt(entry.media?.alt || entry.label)
  }

  async function submitAction(args: {
    action: DrawerAction
    altFallback?: string
    file?: File
    mediaKind?: 'image' | 'video'
    mediaId?: null | number
    pageId?: null | number
    prompt?: string
    relationPath?: null | string
    sourceMediaId?: null | number
    success: string
  }) {
    setSubmittingAction(args.action)
    setStatus(null)

    try {
      const formData = new FormData()
      formData.set('action', args.action)

      if (args.file) {
        formData.set('file', args.file)
      }

      formData.set('mediaKind', args.mediaKind || 'image')

      if (args.prompt?.trim()) {
        formData.set('prompt', args.prompt.trim())
      }

      if (args.mediaId) {
        formData.set('mediaId', String(args.mediaId))
      }

      if (args.pageId) {
        formData.set('pageId', String(args.pageId))
      }

      if (args.relationPath) {
        formData.set('relationPath', args.relationPath)
      }

      if (args.sourceMediaId) {
        formData.set('sourceMediaId', String(args.sourceMediaId))
      }

      if (args.prompt?.trim()) {
        formData.set('alt', buildAltFromPrompt(args.prompt, args.altFallback || 'Generated image'))
      } else if (args.file) {
        formData.set('alt', buildAltFromFilename(args.file.name, args.altFallback || 'Uploaded image'))
      }

      const response = await fetch('/api/internal/dev/page-media', {
        body: formData,
        method: 'POST',
      })
      const payload = (await response.json().catch(() => null)) as null | {
        error?: string
        media?: MediaLibraryItem
        mediaId?: number
      }

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to update local media.')
      }

      setStatus(args.success)
      setPagePrompt('')
      setPageEditorOpen(false)
      setLibraryPrompt('')
      setLibraryPromptOpen(false)
      await loadLibrary(false)

      if (payload?.mediaId) {
        setSelectedLibraryId(payload.mediaId)
      }

      router.refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to update local media.')
    } finally {
      setSubmittingAction(null)
    }
  }

  if (!enabled) {
    return null
  }

  return (
    <>
      <Button disabled={!currentPage} onClick={() => setOpen(true)} size="sm" type="button" variant="ghost">
        <ImageIcon className="h-4 w-4" />
        Page media
        {entries.length > 0 ? <Badge variant="secondary">{entries.length}</Badge> : null}
      </Button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              aria-label="Close page media sidebar"
              className="fixed inset-0 z-[88] bg-black/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              type="button"
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-[89] flex w-[min(100vw,34rem)] flex-col border-l border-border/70 bg-background/96 shadow-2xl backdrop-blur"
              initial={{ opacity: 0, x: 64 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 64 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Local media devtools</Badge>
                    {currentPage ? <Badge variant="secondary">{currentPage.pageSlug}</Badge> : null}
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-foreground">Local media workbench</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currentPage
                      ? `Manage page slots and media records for ${currentPage.pageTitle} without leaving the page.`
                      : 'Open a frontend page with registered media relationships to use this tool.'}
                  </p>
                </div>
                <Button onClick={() => setOpen(false)} size="icon" type="button" variant="ghost">
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>

              {!currentPage ? (
                <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  Open a frontend page with registered media relationships to use this tool.
                </div>
              ) : (
                <>
                  <Tabs
                    className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]"
                    onValueChange={(value) => setActiveTab(value as 'library' | 'page')}
                    value={activeTab}
                  >
                  <div className="border-b border-border/70 px-5 py-3">
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl p-1">
                      <TabsTrigger value="page">Page media</TabsTrigger>
                      <TabsTrigger value="library">Media library</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent className="mt-0 min-h-0" value="page">
                    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
                      <div className="min-h-0 overflow-y-auto px-5 py-4" data-portal-scroll="">
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            {entries.map((entry) => {
                              const duplicateCount = entry.mediaId ? duplicates.get(entry.mediaId) || 0 : 0

                              return (
                                <UploadSurface
                                  key={entry.relationPath}
                                  actions={
                                    <Button
                                      className="rounded-full"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        openPageEditor(entry, getMediaKindFromMimeType(entry.media?.mimeType))
                                      }}
                                      size="icon"
                                      type="button"
                                      variant="secondary"
                                    >
                                      <SparklesIcon className="h-4 w-4" />
                                    </Button>
                                  }
                                  badges={
                                    <>
                                      <Badge variant="outline">{entry.relationPath}</Badge>
                                      {entry.mediaId ? <Badge variant="secondary">ID {entry.mediaId}</Badge> : null}
                                      {duplicateCount > 1 ? <Badge variant="secondary">Used {duplicateCount} times</Badge> : null}
                                    </>
                                  }
                                  description={entry.media?.filename || 'Click to focus this slot and swap what is displayed.'}
                                  emptyLabel="Click to focus this page slot"
                                  onClick={() => openPageEditor(entry, getMediaKindFromMimeType(entry.media?.mimeType))}
                                  previewMimeType={entry.media?.mimeType}
                                  previewUrl={entry.media?.previewUrl}
                                  selected={selectedEntry?.relationPath === entry.relationPath}
                                  title={entry.label}
                                />
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border/70 px-5 py-4 text-xs text-muted-foreground">
                        Click a page slot to focus it, then upload, generate, or swap from the modal.
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent className="mt-0 min-h-0" value="library">
                    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
                      <div className="min-h-0 overflow-y-auto px-5 py-4" data-portal-scroll="">
                        <div className="grid gap-4">
                          <UploadSurface
                            actions={
                              <>
                                <input
                                  accept="image/*,video/*"
                                  className="hidden"
                                  ref={libraryCreateInputRef}
                                  type="file"
                                  onChange={async (event) => {
                                    const file = event.target.files?.[0]
                                    if (!file) return
                                    await submitAction({
                                      action: 'create-only',
                                      altFallback: buildAltFromFilename(file.name, 'New media record'),
                                      file,
                                      mediaKind: getFileKind(file),
                                      success: `Created media record ${file.name}.`,
                                    })
                                    event.currentTarget.value = ''
                                  }}
                                />
                                <Button onClick={() => libraryCreateInputRef.current?.click()} size="sm" type="button" variant="secondary">
                                  <UploadIcon className="h-4 w-4" />
                                  Upload new media
                                </Button>
                                <Button
                                  onClick={() => {
                                    setSelectedLibraryId(null)
                                    setLibraryPrompt('')
                                    setLibraryPromptOpen(true)
                                  }}
                                  size="sm"
                                  type="button"
                                >
                                  <SparklesIcon className="h-4 w-4" />
                                  Generate new media
                                </Button>
                              </>
                            }
                            badges={<Badge variant="outline">Create record</Badge>}
                          description="Drop an image here, upload from disk, or generate a brand-new media record into the local library."
                          emptyLabel="Drop an image or video to create a new media record"
                          onDropFile={async (file) => {
                            await submitAction({
                              action: 'create-only',
                              altFallback: buildAltFromFilename(file.name, 'New media record'),
                              file,
                              mediaKind: getFileKind(file),
                              success: `Created media record ${file.name}.`,
                            })
                          }}
                          selected={libraryPromptOpen && !selectedLibraryId}
                          title="New media placeholder"
                          >
                            {libraryPromptOpen && !selectedLibraryId ? (
                              <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3">
                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                  Generate new media record
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => setLibraryPromptKind('image')}
                                    size="sm"
                                    type="button"
                                    variant={libraryPromptKind === 'image' ? 'default' : 'outline'}
                                  >
                                    Image
                                  </Button>
                                  <Button
                                    onClick={() => setLibraryPromptKind('video')}
                                    size="sm"
                                    type="button"
                                    variant={libraryPromptKind === 'video' ? 'default' : 'outline'}
                                  >
                                    Video
                                  </Button>
                                </div>
                                <Textarea
                                  className="min-h-24"
                                  onChange={(event) => setLibraryPrompt(event.target.value)}
                                  placeholder={`Describe the ${libraryPromptKind} you want to add to the local media library...`}
                                  value={libraryPrompt}
                                />
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    disabled={submittingAction !== null}
                                    onClick={() =>
                                      submitAction({
                                        action: 'generate-only',
                                        altFallback: 'Generated media record',
                                        mediaKind: libraryPromptKind,
                                        prompt: libraryPrompt,
                                        success: 'Generated a new media record.',
                                      })
                                    }
                                    size="sm"
                                    type="button"
                                  >
                                    {submittingAction === 'generate-only' ? (
                                      <>
                                        <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                                        Generating...
                                      </>
                                    ) : (
                                      `Generate ${libraryPromptKind}`
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setLibraryPrompt('')
                                      setLibraryPromptOpen(false)
                                    }}
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : null}
                          </UploadSurface>

                          <div className="grid gap-2">
                            {libraryLoading ? (
                              <div className="rounded-2xl border border-border/70 bg-card/52 px-4 py-6 text-sm text-muted-foreground">
                                Loading local media records...
                              </div>
                            ) : (
                              libraryItems.map((item) => (
                                <UploadSurface
                                  key={item.id}
                                  actions={
                                    <>
                                      <input
                                        accept="image/*,video/*"
                                        className="hidden"
                                        type="file"
                                        onChange={async (event) => {
                                          const file = event.target.files?.[0]
                                          if (!file) return
                                          setSelectedLibraryId(item.id)
                                          await submitAction({
                                            action: 'replace-existing',
                                            altFallback: item.alt || item.filename || `Media ${item.id}`,
                                            file,
                                            mediaKind: getFileKind(file),
                                            mediaId: item.id,
                                            success: `Updated media record ${item.id}.`,
                                          })
                                          event.currentTarget.value = ''
                                        }}
                                      />
                                      <Button
                                        onClick={(event) => {
                                          setSelectedLibraryId(item.id)
                                          const input = event.currentTarget.previousElementSibling as HTMLInputElement | null
                                          input?.click()
                                        }}
                                        size="sm"
                                        type="button"
                                        variant="secondary"
                                      >
                                        <PencilLineIcon className="h-4 w-4" />
                                        Replace
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          setSelectedLibraryId(item.id)
                                          setLibraryPrompt(item.alt || item.filename || '')
                                          setLibraryPromptKind(getMediaKindFromMimeType(item.mimeType))
                                          setLibraryPromptOpen(true)
                                        }}
                                        size="sm"
                                        type="button"
                                        variant="secondary"
                                      >
                                        <SparklesIcon className="h-4 w-4" />
                                        Generate
                                      </Button>
                                      {selectedEntry ? (
                                        <Button
                                          onClick={() => {
                                            setSelectedLibraryId(item.id)
                                            void submitAction({
                                              action: 'swap-existing-reference',
                                              mediaId: item.id,
                                              pageId: selectedEntry.pageId,
                                              relationPath: selectedEntry.relationPath,
                                              success: `Swapped ${selectedEntry.label} to media record ${item.id}.`,
                                            })
                                          }}
                                          size="sm"
                                          type="button"
                                        >
                                          Use for page slot
                                        </Button>
                                      ) : null}
                                    </>
                                  }
                                  badges={
                                    <>
                                      <Badge variant="outline">ID {item.id}</Badge>
                                      <Badge variant="secondary">{formatUpdatedAt(item.updatedAt)}</Badge>
                                    </>
                                  }
                                  description={item.alt || item.filename || 'No alt text set'}
                                  onDropFile={async (file) => {
                                    setSelectedLibraryId(item.id)
                                    await submitAction({
                                      action: 'replace-existing',
                                      altFallback: item.alt || item.filename || `Media ${item.id}`,
                                      file,
                                      mediaKind: getFileKind(file),
                                      mediaId: item.id,
                                      success: `Updated media record ${item.id}.`,
                                    })
                                  }}
                                  previewMimeType={item.mimeType}
                                  previewUrl={item.previewUrl}
                                  selected={selectedLibraryId === item.id}
                                  title={item.filename || `Media record ${item.id}`}
                                >
                                  {selectedLibraryId === item.id && libraryPromptOpen ? (
                                    <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-3">
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                          Generate into this record
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            onClick={() => setLibraryPromptKind('image')}
                                            size="sm"
                                            type="button"
                                            variant={libraryPromptKind === 'image' ? 'default' : 'outline'}
                                          >
                                            Image
                                          </Button>
                                          <Button
                                            onClick={() => setLibraryPromptKind('video')}
                                            size="sm"
                                            type="button"
                                            variant={libraryPromptKind === 'video' ? 'default' : 'outline'}
                                          >
                                            Video
                                          </Button>
                                        </div>
                                      </div>
                                      <Textarea
                                        className="min-h-24"
                                        onChange={(event) => setLibraryPrompt(event.target.value)}
                                        placeholder={`Describe the updated ${libraryPromptKind} for this record...`}
                                        value={libraryPrompt}
                                      />
                                      <div className="flex flex-wrap gap-2">
                                        <Button
                                          disabled={submittingAction !== null}
                                          onClick={() =>
                                            submitAction({
                                              action: 'generate-replace-existing',
                                              altFallback: item.alt || item.filename || `Media ${item.id}`,
                                              mediaId: item.id,
                                              mediaKind: libraryPromptKind,
                                              prompt: libraryPrompt,
                                              sourceMediaId: item.id,
                                              success: `Generated into media record ${item.id}.`,
                                            })
                                          }
                                          size="sm"
                                          type="button"
                                        >
                                          {submittingAction === 'generate-replace-existing' ? (
                                            <>
                                              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                                              Generating...
                                            </>
                                          ) : (
                                            `Generate ${libraryPromptKind}`
                                          )}
                                        </Button>
                                        <Button
                                          onClick={() => {
                                            setLibraryPrompt('')
                                            setLibraryPromptOpen(false)
                                          }}
                                          size="sm"
                                          type="button"
                                          variant="outline"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : null}
                                </UploadSurface>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border/70 px-5 py-4 text-xs text-muted-foreground">
                        Drag onto the placeholder to create new media, or onto any library card to replace that record in place.
                      </div>
                    </div>
                  </TabsContent>
                  </Tabs>
                  <AnimatePresence>
                  {pageEditorOpen && selectedEntry ? (
                    <>
                      <motion.button
                        aria-label="Close page media editor"
                        className="absolute inset-0 z-[95] bg-background/72 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closePageEditor}
                        type="button"
                      />
                      <motion.div
                        className="absolute inset-x-4 top-4 bottom-4 z-[96] flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                      >
                        <div className="grid h-full w-full max-w-2xl grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-[1.7rem] border border-border/80 bg-background shadow-2xl">
                          <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">{selectedEntry.relationPath}</Badge>
                                {selectedEntry.mediaId ? <Badge variant="secondary">ID {selectedEntry.mediaId}</Badge> : null}
                                {selectedEntry.mediaId && (duplicates.get(selectedEntry.mediaId) || 0) > 1 ? (
                                  <Badge variant="secondary">Used {(duplicates.get(selectedEntry.mediaId) || 0).toString()} times</Badge>
                                ) : null}
                              </div>
                              <div className="mt-2 text-lg font-semibold text-foreground">{selectedEntry.label}</div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                Replace the media shown in this slot without leaving the page.
                              </div>
                            </div>
                            <Button onClick={closePageEditor} size="icon" type="button" variant="ghost">
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="border-b border-border/70 px-5 py-3">
                            <Tabs
                              onValueChange={(value) => {
                                setPageEditorTab(value as 'gallery' | 'image' | 'video')
                              }}
                              value={pageEditorTab}
                            >
                              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl p-1">
                                <TabsTrigger value="image">Image</TabsTrigger>
                                <TabsTrigger value="video">Video</TabsTrigger>
                                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                              </TabsList>
                            </Tabs>
                          </div>

                          <div className="min-h-0 overflow-y-auto px-5 py-4">
                            {pageEditorTab === 'gallery' ? (
                              <div className="grid gap-3">
                                {libraryLoading ? (
                                  <div className="rounded-2xl border border-border/70 bg-card/52 px-4 py-6 text-sm text-muted-foreground">
                                    Loading local media records...
                                  </div>
                                ) : (
                                  libraryItems.map((item) => (
                                    <UploadSurface
                                      key={`modal-library-${item.id}`}
                                      actions={
                                        <Button
                                          onClick={(event) => {
                                            event.stopPropagation()
                                            void submitAction({
                                              action: 'swap-existing-reference',
                                              mediaId: item.id,
                                              pageId: selectedEntry.pageId,
                                              relationPath: selectedEntry.relationPath,
                                              success: `Swapped ${selectedEntry.label} to media record ${item.id}.`,
                                            })
                                          }}
                                          size="sm"
                                          type="button"
                                        >
                                          Use this media
                                        </Button>
                                      }
                                      badges={
                                        <>
                                          <Badge variant="outline">ID {item.id}</Badge>
                                          <Badge variant="secondary">{formatUpdatedAt(item.updatedAt)}</Badge>
                                        </>
                                      }
                                      description={item.alt || item.filename || 'No alt text set'}
                                      previewMimeType={item.mimeType}
                                      previewUrl={item.previewUrl}
                                      selected={selectedLibraryId === item.id}
                                      title={item.filename || `Media record ${item.id}`}
                                    />
                                  ))
                                )}
                              </div>
                            ) : (
                              <div className="grid gap-4">
                                <input
                                  accept="image/*,video/*"
                                  className="hidden"
                                  ref={pageUploadInputRef}
                                  type="file"
                                  onChange={async (event) => {
                                    const file = event.target.files?.[0]
                                    if (!file) return
                                    await submitAction({
                                      action: 'create-and-swap',
                                      altFallback: selectedEntry.media?.alt || selectedEntry.label,
                                      file,
                                      mediaKind: getFileKind(file),
                                      pageId: selectedEntry.pageId,
                                      relationPath: selectedEntry.relationPath,
                                      success: `Created a new media record and swapped ${selectedEntry.label}.`,
                                    })
                                    event.currentTarget.value = ''
                                  }}
                                />
                                <UploadSurface
                                  actions={
                                    <Button onClick={() => pageUploadInputRef.current?.click()} size="sm" type="button" variant="secondary">
                                      <UploadIcon className="h-4 w-4" />
                                      Upload from device
                                    </Button>
                                  }
                                  description="Drop an image or video here, or upload from disk. This always saves a new media record for this page slot."
                                  emptyLabel="Drop an image or video here"
                                  onDropFile={async (file) => {
                                    await submitAction({
                                      action: 'create-and-swap',
                                      altFallback: selectedEntry.media?.alt || selectedEntry.label,
                                      file,
                                      mediaKind: getFileKind(file),
                                      pageId: selectedEntry.pageId,
                                      relationPath: selectedEntry.relationPath,
                                      success: `Created a new media record and swapped ${selectedEntry.label}.`,
                                    })
                                  }}
                                  previewMimeType={selectedEntry.media?.mimeType}
                                  previewUrl={selectedEntry.media?.previewUrl}
                                  title={pageEditorTab === 'video' ? 'Source media for video iteration' : 'Current media'}
                                />

                                <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
                                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Generate {pageEditorTab}
                                  </div>
                                  <Textarea
                                    className="min-h-28"
                                    onChange={(event) => setPagePrompt(event.target.value)}
                                    placeholder={`Describe the ${pageEditorTab} for ${selectedEntry.label.toLowerCase()}...`}
                                    value={pagePrompt}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 px-5 py-4">
                            <Button onClick={closePageEditor} size="sm" type="button" variant="outline">
                              Cancel
                            </Button>
                            {pageEditorTab === 'gallery' ? null : (
                              <Button
                                disabled={submittingAction !== null}
                                onClick={() =>
                                  submitAction({
                                    action: 'generate-and-swap',
                                    altFallback: selectedEntry.media?.alt || selectedEntry.label,
                                    mediaKind: pageEditorTab,
                                    pageId: selectedEntry.pageId,
                                    prompt: pagePrompt,
                                    relationPath: selectedEntry.relationPath,
                                    sourceMediaId: selectedEntry.mediaId,
                                    success: `Generated a new media record and swapped ${selectedEntry.label}.`,
                                  })
                                }
                                size="sm"
                                type="button"
                              >
                                {submittingAction === 'generate-and-swap' ? (
                                  <>
                                    <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  `Generate ${pageEditorTab}`
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </>
                  ) : null}
                  </AnimatePresence>
                </>
              )}

              {status ? <div className="border-t border-border/70 px-5 py-3 text-sm text-muted-foreground">{status}</div> : null}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
