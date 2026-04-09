'use client'

import { Badge } from '@/components/ui/badge'
import type { SectionMediaSlot } from '@/components/page-composer/drawer/PageComposerDrawerMediaTypes'
import { getMediaKindFromMimeType } from '@/components/page-composer/drawer/PageComposerDrawerMediaTypes'

export function PageComposerDrawerMediaSlotList({
  mediaSlots,
  selectedMediaSlot,
  setMediaKind,
  setSelectedMediaPath,
}: {
  mediaSlots: SectionMediaSlot[]
  selectedMediaSlot: SectionMediaSlot | null
  setMediaKind: (value: 'image' | 'video') => void
  setSelectedMediaPath: (value: null | string) => void
}) {
  return (
    <div className="grid gap-3">
      {mediaSlots.map((slot) => (
        <button
          aria-label={slot.label}
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
  )
}
