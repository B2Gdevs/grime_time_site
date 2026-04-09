'use client'

import { useMemo, useState } from 'react'
import { PlusIcon, RefreshCwIcon, SearchIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { PageComposerDrawerMediaLibraryCard } from '@/components/page-composer/drawer/PageComposerDrawerMediaLibraryCard'
import { PageComposerMediaLibraryAddModal } from '@/components/page-composer/drawer/PageComposerMediaLibraryAddModal'
import type {
  MediaAction,
  MediaKind,
  MediaLibraryItem,
  SectionMediaSlot,
} from '@/components/page-composer/drawer/PageComposerDrawerMediaTypes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function isAcceptableMediaFile(file: File) {
  return file.type.startsWith('image/') || file.type.startsWith('video/')
}

export function PageComposerMediaGallery({
  busy,
  dragDisabled,
  loadMediaLibrary,
  mediaActionsLocked,
  mediaKind,
  mediaLibrary,
  mediaLoading,
  mediaPrompt,
  onGenerateItem,
  requestReplaceFile,
  selectedMediaSlot,
  setMediaKind,
  setMediaPrompt,
  submitMediaAction,
}: {
  busy: boolean
  dragDisabled: boolean
  loadMediaLibrary: () => void
  mediaActionsLocked: boolean
  mediaKind: MediaKind
  mediaLibrary: MediaLibraryItem[]
  mediaLoading: boolean
  mediaPrompt: string
  onGenerateItem?: (item: MediaLibraryItem) => void
  requestReplaceFile: (mediaId: number) => void
  selectedMediaSlot: SectionMediaSlot | null
  setMediaKind: (value: MediaKind) => void
  setMediaPrompt: (value: string) => void
  submitMediaAction: (args: {
    action: MediaAction
    file?: File
    mediaId?: number | null
    prompt?: string
    relationPath?: string
    success: string
  }) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [fileOverGallery, setFileOverGallery] = useState(false)

  const filteredLibrary = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return mediaLibrary
    return mediaLibrary.filter((item) => {
      const hay = [item.alt, item.filename, String(item.id)].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [mediaLibrary, query])

  async function addLibraryFile(file: File) {
    if (!isAcceptableMediaFile(file) || busy) return
    await submitMediaAction({
      action: 'create-only',
      file,
      success: 'Added to library.',
    })
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Gallery</h4>
        <div className="relative min-w-[12rem] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search media library"
            className="h-10 rounded-xl pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or ID..."
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

      <div
        className={`relative min-h-0 rounded-2xl transition-colors ${
          fileOverGallery ? 'bg-primary/5 ring-2 ring-primary/40 ring-offset-2 ring-offset-background' : ''
        }`}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setFileOverGallery(false)
          }
        }}
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes('Files')) return
          event.preventDefault()
          event.dataTransfer.dropEffect = 'copy'
          setFileOverGallery(true)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setFileOverGallery(false)
          const file = event.dataTransfer.files?.[0]
          if (file) void addLibraryFile(file)
        }}
      >
        {fileOverGallery ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/80 text-sm font-medium text-foreground backdrop-blur-[1px]"
          >
            Drop to add to library
          </div>
        ) : null}

        <div className="min-h-0">
          {mediaLoading ? (
            <div className={adminPanelChrome.emptyOnBackground}>Loading media...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="list">
                <button
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-muted-foreground/35 bg-muted/20 text-muted-foreground transition hover:border-primary/50 hover:bg-muted/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
                  data-page-composer-no-drag="true"
                  disabled={busy}
                  onClick={() => setAddModalOpen(true)}
                  type="button"
                >
                  <PlusIcon aria-hidden className="h-8 w-8" />
                  <span className="text-xs font-medium">Add media</span>
                </button>
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
                        `Delete "${label}" permanently? This removes the media record from the CMS. Pages referencing it may break until updated.`,
                      )
                      if (!ok) return
                      void submitMediaAction({
                        action: 'delete-media',
                        mediaId: item.id,
                        success: 'Media deleted.',
                      })
                    }}
                    onGenerate={onGenerateItem ? () => onGenerateItem(item) : undefined}
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
              {filteredLibrary.length === 0 ? (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {query.trim()
                    ? 'No media matches your search.'
                    : mediaLibrary.length === 0
                      ? 'No media in the library yet. Use the add tile or drop files here.'
                      : 'No media matches your search.'}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <PageComposerMediaLibraryAddModal
        busy={busy}
        mediaKind={mediaKind}
        mediaPrompt={mediaPrompt}
        onOpenChange={setAddModalOpen}
        open={addModalOpen}
        setMediaKind={setMediaKind}
        setMediaPrompt={setMediaPrompt}
        submitMediaAction={submitMediaAction}
      />
    </div>
  )
}
