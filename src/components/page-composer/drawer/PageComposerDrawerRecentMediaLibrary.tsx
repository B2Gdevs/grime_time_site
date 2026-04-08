'use client'
/* eslint-disable @next/next/no-img-element */

import { ImageIcon, RefreshCwIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { MediaAction, MediaLibraryItem, SectionMediaSlot } from '@/components/page-composer/drawer/PageComposerDrawerMediaTypes'
import { getMediaKindFromMimeType } from '@/components/page-composer/drawer/PageComposerDrawerMediaTypes'
import { formatComposerTimestamp } from '@/utilities/formatComposerTimestamp'

export function PageComposerDrawerRecentMediaLibrary({
  loadMediaLibrary,
  mediaActionsLocked,
  mediaLibrary,
  mediaLoading,
  selectedMediaSlot,
  submitMediaAction,
  submittingMediaAction,
}: {
  loadMediaLibrary: () => void
  mediaActionsLocked: boolean
  mediaLibrary: MediaLibraryItem[]
  mediaLoading: boolean
  selectedMediaSlot: SectionMediaSlot
  submitMediaAction: (args: {
    action: MediaAction
    file?: File
    mediaId?: null | number
    prompt?: string
    relationPath: string
    success: string
  }) => Promise<void>
  submittingMediaAction: null | MediaAction
}) {
  return (
    <div className={adminPanelChrome.cardRounded3xlP4}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Recent media</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Reuse a recent media record for this row instead of creating a duplicate asset.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{mediaLibrary.length} records</Badge>
          <Button disabled={mediaLoading} onClick={loadMediaLibrary} size="sm" type="button" variant="ghost">
            <RefreshCwIcon className={`h-4 w-4 ${mediaLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
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
                  {item.filename || 'Untitled media'} - {formatComposerTimestamp(item.updatedAt)}
                </div>
              </div>
              <Button
                disabled={mediaActionsLocked || submittingMediaAction !== null}
                onClick={() => {
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
  )
}


