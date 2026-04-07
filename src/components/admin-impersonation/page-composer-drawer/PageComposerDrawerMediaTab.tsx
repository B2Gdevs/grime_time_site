'use client'
/* eslint-disable @next/next/no-img-element */

import type { MutableRefObject, ReactNode } from 'react'
import { ImageIcon, LoaderCircleIcon, RefreshCwIcon, SparklesIcon, UploadIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatComposerTimestamp } from '@/utilities/formatComposerTimestamp'
import type { ServiceGridBlock } from '@/payload-types'

type MediaAction = 'create-and-swap' | 'generate-and-swap' | 'swap-existing-reference'

type MediaLibraryItem = {
  alt: null | string
  filename: null | string
  id: number
  mimeType: null | string
  previewUrl: null | string
  updatedAt: string
}

export type SectionMediaSlot = {
  label: string
  media: {
    alt: null | string
    filename: null | string
    mimeType: null | string
    previewUrl: null | string
    updatedAt: string | null
  } | null
  mediaId: number | null
  mimeType: null | string
  relationPath: string
}

function getMediaKindFromMimeType(mimeType: null | string | undefined): 'image' | 'video' {
  return mimeType?.startsWith('video/') ? 'video' : 'image'
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className={adminPanelChrome.panelEmptyMuted}>{children}</div>
}

export function PageComposerDrawerMediaTab({
  copilot,
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
  mediaSlots,
  selectedIndex,
  selectedMediaSlot,
  selectedServiceGrid,
  setMediaKind,
  setMediaPrompt,
  setSelectedMediaPath,
  submitMediaAction,
  submittingMediaAction,
  mediaUploadInputRef,
}: {
  copilot: null | {
    openFocusedMediaSession: (args: { mode?: 'image' | 'video'; promptHint?: string }) => void
  }
  dirty: boolean
  draftPage: null | { pagePath: string }
  loadMediaLibrary: () => void
  loading: boolean
  mediaActionsLocked: boolean
  mediaKind: 'image' | 'video'
  mediaLibrary: MediaLibraryItem[]
  mediaLoading: boolean
  mediaPrompt: string
  mediaPromptId: string
  mediaSlots: SectionMediaSlot[]
  selectedIndex: number
  selectedMediaSlot: SectionMediaSlot | null
  selectedServiceGrid: null | Pick<ServiceGridBlock, 'heading'>
  setMediaKind: (value: 'image' | 'video') => void
  setMediaPrompt: (value: string) => void
  setSelectedMediaPath: (value: null | string) => void
  submitMediaAction: (args: {
    action: MediaAction
    file?: File
    mediaId?: number | null
    prompt?: string
    relationPath: string
    success: string
  }) => Promise<void>
  submittingMediaAction: null | MediaAction
  mediaUploadInputRef: MutableRefObject<HTMLInputElement | null>
}) {
  return (
    <div className="grid gap-4">
      {loading ? (
        <EmptyState>Loading section media...</EmptyState>
      ) : !draftPage ? (
        <EmptyState>No page is available for this route.</EmptyState>
      ) : selectedIndex < 0 ? (
        <EmptyState>
          Hero media swaps and generation live directly on the canvas. Hover the hero image on the page to replace or generate media.
        </EmptyState>
      ) : !selectedServiceGrid ? (
        <EmptyState>
          This first media editor is focused on `serviceGrid` rows. Other media relationships still use the existing page media tools while the unified composer expands.
        </EmptyState>
      ) : (
        <>
          <div className={adminPanelChrome.card}>
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
            <div className={adminPanelChrome.warnAmber}>
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
                <div className={adminPanelChrome.cardOverflowRounded3xl}>
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

                <div className={adminPanelChrome.cardGridRounded3xl}>
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
                      Last updated: <span className="text-foreground">{formatComposerTimestamp(selectedMediaSlot.media?.updatedAt)}</span>
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

              <div className={adminPanelChrome.cardRounded3xlP4}>
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
                  <Button
                    disabled={mediaActionsLocked || submittingMediaAction !== null}
                    onClick={() => mediaUploadInputRef.current?.click()}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
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
                  <label className={adminPanelChrome.fieldLabel} htmlFor={mediaPromptId}>
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

              <div className={adminPanelChrome.cardRounded3xlP4}>
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
                    <div className={adminPanelChrome.emptyOnBackground}>Loading media library...</div>
                  ) : mediaLibrary.length ? (
                    mediaLibrary.slice(0, 12).map((item) => (
                      <div className={adminPanelChrome.mediaRow} key={item.id}>
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
                          <div className="mt-1 text-xs text-muted-foreground">
                            {item.filename || 'Untitled media'} · {formatComposerTimestamp(item.updatedAt)}
                          </div>
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
                    <div className={adminPanelChrome.emptyOnBackground}>No media records are available yet.</div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
