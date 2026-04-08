'use client'

import { type MutableRefObject, useRef, useMemo, useState } from 'react'
import { InfoIcon, RefreshCwIcon, SearchIcon, UploadIcon, Wand2Icon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { PageComposerDrawerMediaLibraryCard } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaLibraryCard'
import type {
  MediaAction,
  MediaLibraryItem,
  SectionMediaSlot,
} from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaTypes'
import { usePortalCopilotOptional } from '@/components/copilot/PortalCopilotContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { PageComposerDocument } from '@/lib/pages/pageComposer'

export function PageComposerDrawerMediaTab({
  copilot: _copilot,
  dirty,
  draftPage,
  loadMediaLibrary,
  loading,
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
}: {
  copilot: null | {
    openFocusedMediaSession: (args: { mode?: 'image' | 'video'; promptHint?: string }) => void
  }
  dirty: boolean
  draftPage: null | PageComposerDocument
  loadMediaLibrary: () => void
  loading: boolean
  mediaActionsLocked: boolean
  mediaKind: 'image' | 'video'
  mediaLibrary: MediaLibraryItem[]
  mediaLoading: boolean
  mediaPrompt: string
  mediaPromptId: string
  mediaUploadInputRef: MutableRefObject<HTMLInputElement | null>
  setMediaKind: (value: 'image' | 'video') => void
  setMediaPrompt: (value: string) => void
  selectedMediaSlot: SectionMediaSlot | null
  submitMediaAction: (args: {
    action: MediaAction
    file?: File
    mediaId?: number | null
    prompt?: string
    relationPath?: string
    success: string
  }) => Promise<void>
  submittingMediaAction: null | MediaAction
}) {
  void _copilot
  const portalCopilot = usePortalCopilotOptional()
  const [query, setQuery] = useState('')
  const [replaceTargetId, setReplaceTargetId] = useState<null | number>(null)
  const replaceInputRef = useRef<HTMLInputElement | null>(null)
  const busy = submittingMediaAction !== null
  const dragDisabled = !draftPage || typeof draftPage.id !== 'number'

  const filteredLibrary = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return mediaLibrary
    return mediaLibrary.filter((item) => {
      const hay = [item.alt, item.filename, String(item.id)].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [mediaLibrary, query])

  function openGenerateInCopilot(item: MediaLibraryItem) {
    if (!portalCopilot) {
      return
    }

    const label = item.alt || item.filename || `Media ${item.id}`

    portalCopilot.setAuthoringContext({
      libraryMedia: {
        id: item.id,
        label,
        mimeType: item.mimeType,
      },
      mediaSlot: null,
      page:
        draftPage && draftPage.id
          ? {
              id: draftPage.id,
              pagePath: draftPage.pagePath,
              slug: draftPage.slug,
              status: draftPage._status === 'published' ? 'published' : 'draft',
              title: draftPage.title || '',
              visibility: draftPage.visibility === 'private' ? 'private' : 'public',
            }
          : null,
      section: null,
      surface: 'media-library',
    })
    portalCopilot.openFocusedMediaSession({
      mode: 'image',
      promptHint: label,
    })
  }

  function requestReplaceFile(mediaId: number) {
    setReplaceTargetId(mediaId)
    requestAnimationFrame(() => replaceInputRef.current?.click())
  }

  if (loading || !draftPage) {
    return (
      <div className={adminPanelChrome.emptyOnBackground}>
        {loading ? 'Loading page…' : 'Open a page in the composer to use the media library.'}
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">Media library</h3>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="About the media library"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                data-page-composer-no-drag="true"
                type="button"
              >
                <InfoIcon aria-hidden className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[280px] text-xs leading-snug" side="bottom">
              Click a media area on the canvas (hero, section, or service row) to target it, then use this gallery.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {selectedMediaSlot ? (
        <p className="text-xs text-muted-foreground">
          Targeting <span className="font-medium text-foreground">{selectedMediaSlot.label}</span>
        </p>
      ) : (
        <div className={adminPanelChrome.emptyOnBackground}>
          Click a media area on the canvas (hero, section, or service row) to target it, then use the gallery below.
        </div>
      )}

      {dirty ? (
        <div className={adminPanelChrome.warnAmber}>
          Draft changes are auto-saved. Dragging library tiles onto canvas media slots stays available while you edit.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search media library"
            className="h-10 rounded-xl pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or ID…"
            type="search"
            value={query}
          />
        </div>
        <Badge variant="outline">{filteredLibrary.length} shown</Badge>
        <Button disabled={mediaLoading} onClick={() => void loadMediaLibrary()} size="sm" type="button" variant="ghost">
          <RefreshCwIcon className={`h-4 w-4 ${mediaLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className={adminPanelChrome.cardRounded3xlP4}>
        <div className="text-sm font-semibold text-foreground">Add to library</div>
        <p className="mt-1 text-xs text-muted-foreground">Upload creates a new media record. Generate uses your prompt.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            accept="image/*,video/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              void submitMediaAction({
                action: 'create-only',
                file,
                success: 'Added to library.',
              })
            }}
            ref={mediaUploadInputRef}
            type="file"
          />
          <Button
            disabled={busy}
            onClick={() => mediaUploadInputRef.current?.click()}
            size="sm"
            type="button"
            variant="outline"
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            Upload file
          </Button>
          <select
            className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
            onChange={(event) => setMediaKind(event.target.value === 'video' ? 'video' : 'image')}
            value={mediaKind}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor={mediaPromptId}>
              Generation prompt
            </label>
            <Input
              className="h-10 rounded-xl"
              id={mediaPromptId}
              onChange={(event) => setMediaPrompt(event.target.value)}
              placeholder="Describe the image or video to generate…"
              value={mediaPrompt}
            />
          </div>
          <Button
            disabled={busy || !mediaPrompt.trim()}
            onClick={() =>
              void submitMediaAction({
                action: 'generate-only',
                prompt: mediaPrompt,
                success: 'Generated media added to library.',
              })
            }
            size="sm"
            type="button"
          >
            <Wand2Icon className="mr-2 h-4 w-4" />
            Generate
          </Button>
        </div>
      </div>

      <input
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          const targetId = replaceTargetId
          setReplaceTargetId(null)
          if (!file || !targetId) return
          void submitMediaAction({
            action: 'replace-existing',
            file,
            mediaId: targetId,
            success: 'Media file replaced.',
          })
        }}
        ref={replaceInputRef}
        type="file"
      />

      <div className="min-h-0">
        {mediaLoading ? (
          <div className={adminPanelChrome.emptyOnBackground}>Loading media…</div>
        ) : filteredLibrary.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="list">
            {filteredLibrary.map((item) => (
              <PageComposerDrawerMediaLibraryCard
                busy={busy}
                dragDisabled={dragDisabled}
                item={item}
                key={item.id}
                mediaActionsLocked={mediaActionsLocked}
                onDelete={() => {
                  const label = item.alt || item.filename || `Media ${item.id}`
                  const ok = window.confirm(
                    `Delete “${label}” permanently? This removes the media record from the CMS. Pages referencing it may break until updated.`,
                  )
                  if (!ok) return
                  void submitMediaAction({
                    action: 'delete-media',
                    mediaId: item.id,
                    success: 'Media deleted.',
                  })
                }}
                onGenerate={() => openGenerateInCopilot(item)}
                onReplaceFilePick={() => requestReplaceFile(item.id)}
                onUseThisMedia={
                  selectedMediaSlot
                    ? () => {
                        void submitMediaAction({
                          action: 'swap-existing-reference',
                          mediaId: item.id,
                          relationPath: selectedMediaSlot.relationPath,
                          success: `Swapped ${selectedMediaSlot.label} to media ${item.id}.`,
                        })
                      }
                    : undefined
                }
                selectedMediaSlot={selectedMediaSlot}
              />
            ))}
          </div>
        ) : (
          <div className={adminPanelChrome.emptyOnBackground}>No media matches your search.</div>
        )}
      </div>
    </div>
  )
}
