'use client'
/* eslint-disable @next/next/no-img-element */

import type { DragEvent } from 'react'
import { ImageIcon, SparklesIcon, Trash2Icon, UploadIcon } from 'lucide-react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import type {
  MediaLibraryItem,
  SectionMediaSlot,
} from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaTypes'
import { getMediaKindFromMimeType } from '@/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaTypes'
import { Button } from '@/components/ui/button'
import { PAGE_COMPOSER_MEDIA_DRAG_MIME, setPageComposerMediaDragData } from '@/lib/pages/pageComposerMediaDrag'
import { cn } from '@/utilities/ui'
import { formatComposerTimestamp } from '@/utilities/formatComposerTimestamp'

export function PageComposerDrawerMediaLibraryCard({
  busy,
  dragDisabled,
  item,
  mediaActionsLocked,
  onDelete,
  onGenerate,
  onReplaceFilePick,
  onUseThisMedia,
  selectedMediaSlot,
}: {
  busy: boolean
  dragDisabled: boolean
  item: MediaLibraryItem
  mediaActionsLocked: boolean
  onDelete: () => void
  onGenerate: () => void
  onReplaceFilePick: () => void
  onUseThisMedia?: () => void
  selectedMediaSlot: SectionMediaSlot | null
}) {
  const label = item.alt || item.filename || `Media ${item.id}`
  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    if (dragDisabled) {
      event.preventDefault()
      return
    }
    setPageComposerMediaDragData(event.dataTransfer, item.id, item.media)
    try {
      event.dataTransfer.setData('text/plain', String(item.id))
    } catch {
      // ignore
    }
  }

  return (
    <div
      className={cn(
        'group/card relative overflow-hidden rounded-2xl border border-border/60 bg-muted/30 text-left transition hover:border-primary/50',
        dragDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-grab active:cursor-grabbing',
      )}
      draggable={!dragDisabled}
      onDragStart={handleDragStart}
      role="listitem"
    >
      <div className="sr-only">
        {label} — drag to canvas ({PAGE_COMPOSER_MEDIA_DRAG_MIME})
      </div>

      <div
        className="aspect-square overflow-hidden bg-muted/40"
        draggable={!dragDisabled}
        onDragStart={handleDragStart}
      >
        {item.previewUrl ? (
          getMediaKindFromMimeType(item.mimeType) === 'video' ? (
            <video className="h-full w-full object-cover" muted playsInline src={item.previewUrl} />
          ) : (
            <img
              alt={label}
              className="h-full w-full object-cover"
              draggable={!dragDisabled}
              src={item.previewUrl}
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-primary/0 transition group-hover/card:border-primary/40 group-hover/card:bg-black/6" />

      <div className="pointer-events-none absolute inset-x-2 top-2 flex justify-end gap-1 opacity-0 transition group-hover/card:opacity-100">
        <div className="pointer-events-auto flex flex-wrap justify-end gap-1">
          <Button
            aria-label={`Replace file for ${label}`}
            className={cn(adminPanelChrome.canvasToolbarIconButton, 'h-8 w-8 bg-background/94 shadow-lg')}
            disabled={busy || mediaActionsLocked}
            onClick={(event) => {
              event.stopPropagation()
              onReplaceFilePick()
            }}
            size="icon"
            type="button"
            variant="secondary"
          >
            <UploadIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            aria-label={`Generate with copilot for ${label}`}
            className={cn(adminPanelChrome.canvasToolbarIconButton, 'h-8 w-8 bg-background/94 shadow-lg')}
            disabled={busy || mediaActionsLocked}
            onClick={(event) => {
              event.stopPropagation()
              onGenerate()
            }}
            size="icon"
            type="button"
            variant="secondary"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            aria-label={`Delete ${label}`}
            className={cn(adminPanelChrome.canvasToolbarIconButton, 'h-8 w-8 bg-background/94 text-destructive shadow-lg')}
            disabled={busy || mediaActionsLocked}
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
            size="icon"
            type="button"
            variant="secondary"
          >
            <Trash2Icon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-1 p-2">
        <div className="truncate text-xs font-medium text-foreground">{label}</div>
        <div className="text-[0.65rem] text-muted-foreground">{formatComposerTimestamp(item.updatedAt)}</div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-primary/75">
            {dragDisabled ? 'Save a draft to place media' : 'Drag to canvas'}
          </div>
          {selectedMediaSlot && onUseThisMedia ? (
            <Button
              aria-label={`Use media ${item.id} for ${selectedMediaSlot.label}`}
              className="h-7 rounded-full px-2.5 text-[0.68rem]"
              disabled={busy || dragDisabled}
              onClick={(event) => {
                event.stopPropagation()
                onUseThisMedia()
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              Use this media
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
