'use client'
/* eslint-disable @next/next/no-img-element */

import { ImageIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { getMediaKindFromMimeType, type SectionMediaSlot } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaTypes'

export function PageComposerDrawerMediaSelectedSlotPreview({ selectedMediaSlot }: { selectedMediaSlot: SectionMediaSlot }) {
  return (
    <div className={adminPanelChrome.cardOverflowRounded3xl}>
      {selectedMediaSlot.media?.previewUrl ? (
        getMediaKindFromMimeType(selectedMediaSlot.media.mimeType) === 'video' ? (
          <video
            className="aspect-video h-full w-full bg-black object-cover"
            controls
            muted
            playsInline
            src={selectedMediaSlot.media.previewUrl}
          />
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
  )
}


