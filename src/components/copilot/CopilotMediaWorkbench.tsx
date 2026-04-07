'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ImageIcon, LoaderCircleIcon, RefreshCwIcon, SparklesIcon, UploadIcon, VideoIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { usePageMediaDevtoolsOptional } from '@/components/admin-impersonation/PageMediaDevtoolsContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { usePortalCopilot } from '@/components/copilot/PortalCopilotContext'
import { cn } from '@/utilities/ui'

type MediaLibraryItem = {
  alt: null | string
  filename: null | string
  id: number
  mimeType: null | string
  previewUrl: null | string
  updatedAt: string
}

type SubmitAction =
  | 'create-and-swap'
  | 'generate-and-swap'
  | 'swap-existing-reference'

function getFileKind(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

function getMediaKindFromMimeType(mimeType: null | string | undefined): 'image' | 'video' {
  return mimeType?.startsWith('video/') ? 'video' : 'image'
}

function buildAlt(prompt: string, fallback: string) {
  return (prompt.trim() || fallback).slice(0, 240)
}

function formatUpdatedAt(value: string) {
  try {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

export function CopilotMediaWorkbench() {
  const router = useRouter()
  const { authoringContext, focusedSession, setFocusedSessionMode } = usePortalCopilot()
  const mediaContext = usePageMediaDevtoolsOptional()
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const [libraryItems, setLibraryItems] = useState<MediaLibraryItem[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<null | string>(null)
  const [submittingAction, setSubmittingAction] = useState<null | SubmitAction>(null)
  const entry = useMemo(() => {
    const relationPath = authoringContext?.mediaSlot?.relationPath
    if (!relationPath || !mediaContext?.currentPage) {
      return null
    }

    return mediaContext.currentPage.entries.find((item) => item.relationPath === relationPath) || null
  }, [authoringContext?.mediaSlot?.relationPath, mediaContext?.currentPage])
  const mode = focusedSession?.type === 'media-generation' ? focusedSession.mode : null

  const loadLibrary = useCallback(async () => {
    if (!entry) {
      return
    }

    setLibraryLoading(true)
    setStatus(null)

    try {
      const response = await fetch('/api/internal/page-composer/media', { method: 'GET' })
      const payload = (await response.json().catch(() => null)) as null | {
        error?: string
        items?: MediaLibraryItem[]
      }

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to load media library.')
      }

      setLibraryItems(payload?.items || [])
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to load media library.')
    } finally {
      setLibraryLoading(false)
    }
  }, [entry])

  useEffect(() => {
    if (focusedSession?.type !== 'media-generation' || !entry) {
      return
    }

    if (focusedSession.promptHint) {
      setPrompt(focusedSession.promptHint)
    }

    void loadLibrary()
  }, [entry, focusedSession, loadLibrary])

  const submitAction = useCallback(async (args: {
    action: SubmitAction
    file?: File
    mediaId?: null | number
    prompt?: string
    sourceMediaId?: null | number
    success: string
  }) => {
    if (!entry) {
      return
    }

    setSubmittingAction(args.action)
    setStatus(null)

    try {
      const formData = new FormData()
      formData.set('action', args.action)
      formData.set('pageId', String(entry.pageId))
      formData.set('relationPath', entry.relationPath)

      if (args.file) {
        formData.set('file', args.file)
        formData.set('mediaKind', getFileKind(args.file))
        formData.set('alt', buildAlt(entry.media?.alt || '', entry.label))
      }

      if (args.mediaId) {
        formData.set('mediaId', String(args.mediaId))
      }

      if (args.prompt?.trim()) {
        formData.set('prompt', args.prompt.trim())
        formData.set('alt', buildAlt(args.prompt, entry.label))
        formData.set('mediaKind', mode === 'video' ? 'video' : 'image')
      }

      if (args.sourceMediaId) {
        formData.set('sourceMediaId', String(args.sourceMediaId))
      }

      const response = await fetch('/api/internal/page-composer/media', {
        body: formData,
        method: 'POST',
      })
      const payload = (await response.json().catch(() => null)) as null | { error?: string }

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to update page media.')
      }

      setStatus(args.success)
      router.refresh()
      await loadLibrary()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to update page media.')
    } finally {
      setSubmittingAction(null)
    }
  }, [entry, loadLibrary, mode, router])

  if (focusedSession?.type !== 'media-generation') {
    return null
  }

  if (!entry || !mediaContext?.enabled) {
    return (
      <div className="mb-4 rounded-[1.5rem] border bg-card/80 p-4 text-sm text-muted-foreground shadow-sm">
        Focus a page media slot from the live canvas first. The copilot media workbench only appears when a real page slot is selected.
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-[1.75rem] border bg-card/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Media workbench</Badge>
            <Badge variant="secondary">{entry.label}</Badge>
            <Badge variant="outline">{entry.relationPath}</Badge>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            This slot now edits in the copilot surface so gallery, generation, and upload stay tied to the selected page media target.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setFocusedSessionMode('image')} size="sm" type="button" variant={mode === 'image' ? 'default' : 'outline'}>
            <ImageIcon className="h-4 w-4" />
            Image
          </Button>
          <Button onClick={() => setFocusedSessionMode('video')} size="sm" type="button" variant={mode === 'video' ? 'default' : 'outline'}>
            <VideoIcon className="h-4 w-4" />
            Video
          </Button>
          <Button onClick={() => setFocusedSessionMode('gallery')} size="sm" type="button" variant={mode === 'gallery' ? 'default' : 'outline'}>
            <SparklesIcon className="h-4 w-4" />
            Gallery
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-[1.35rem] border border-border/70 bg-background/70 p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Current media</div>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border/70 bg-muted">
            {entry.media?.previewUrl ? (
              getMediaKindFromMimeType(entry.media?.mimeType) === 'video' ? (
                <video autoPlay className="aspect-[16/10] w-full object-cover" loop muted playsInline src={entry.media.previewUrl} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={entry.media?.alt || entry.label} className="aspect-[16/10] w-full object-cover" src={entry.media.previewUrl} />
              )
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2 text-center">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-xs">No media assigned yet</span>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
            <div>Current file: <span className="text-foreground">{entry.media?.filename || 'None'}</span></div>
            <div>Media id: <span className="text-foreground">{entry.mediaId || 'Unassigned'}</span></div>
          </div>
          {mode !== 'gallery' ? (
            <div className="mt-4 grid gap-3">
              <input
                accept={mode === 'video' ? 'video/*' : 'image/*'}
                className="hidden"
                ref={uploadInputRef}
                type="file"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  await submitAction({
                    action: 'create-and-swap',
                    file,
                    success: `Created a new media record and swapped ${entry.label}.`,
                  })
                  event.currentTarget.value = ''
                }}
              />
              <Button onClick={() => uploadInputRef.current?.click()} size="sm" type="button" variant="outline">
                <UploadIcon className="h-4 w-4" />
                Upload {mode}
              </Button>
              <Textarea
                className="min-h-24"
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={`Describe the ${mode} for ${entry.label.toLowerCase()}...`}
                value={prompt}
              />
              <Button
                disabled={submittingAction !== null}
                onClick={() =>
                  submitAction({
                    action: 'generate-and-swap',
                    prompt,
                    sourceMediaId: entry.mediaId,
                    success: `Generated a new ${mode} and swapped ${entry.label}.`,
                  })}
                size="sm"
                type="button"
              >
                {submittingAction === 'generate-and-swap' ? (
                  <>
                    <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4" />
                    Generate {mode}
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.35rem] border border-border/70 bg-background/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Recent media</div>
            <Button disabled={libraryLoading} onClick={() => void loadLibrary()} size="sm" type="button" variant="ghost">
              <RefreshCwIcon className={cn('h-4 w-4', libraryLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
          <div className="mt-3 max-h-[24rem] space-y-3 overflow-y-auto pr-1">
            {libraryLoading ? (
              <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                Loading media library...
              </div>
            ) : libraryItems.length ? (
              libraryItems.map((item) => (
                <div className="rounded-2xl border border-border/70 bg-card/50 p-3" key={item.id}>
                  <div className="overflow-hidden rounded-xl border border-border/70 bg-muted">
                    {getMediaKindFromMimeType(item.mimeType) === 'video' ? (
                      <video autoPlay className="aspect-[16/10] w-full object-cover" loop muted playsInline src={item.previewUrl || undefined} />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={item.alt || item.filename || `Media ${item.id}`} className="aspect-[16/10] w-full object-cover" src={item.previewUrl || ''} />
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="text-sm font-medium text-foreground">{item.filename || `Media ${item.id}`}</div>
                    <Badge variant="outline">ID {item.id}</Badge>
                    <Badge variant="secondary">{formatUpdatedAt(item.updatedAt)}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.alt || 'No alt text set'}</div>
                  <div className="mt-3">
                    <Button
                      disabled={submittingAction !== null}
                      onClick={() =>
                        submitAction({
                          action: 'swap-existing-reference',
                          mediaId: item.id,
                          success: `Swapped ${entry.label} to media record ${item.id}.`,
                        })}
                      size="sm"
                      type="button"
                    >
                      Use this media
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-6 text-sm text-muted-foreground">
                No media records are available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {status ? <div className="mt-4 text-sm text-muted-foreground">{status}</div> : null}
    </div>
  )
}
