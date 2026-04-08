/** Drag-and-drop payload from the composer media library to canvas slots (see InlinePageMediaEditor). */
export const PAGE_COMPOSER_MEDIA_DRAG_MIME = 'application/x-page-composer-media-id'
export const PAGE_COMPOSER_MEDIA_DRAG_PAYLOAD_MIME = 'application/x-page-composer-media'

export type PageComposerMediaDragPayload = {
  id: number
  media?: unknown
}

export function setPageComposerMediaDragData(
  dataTransfer: DataTransfer,
  mediaId: number,
  media?: unknown,
): void {
  dataTransfer.setData(PAGE_COMPOSER_MEDIA_DRAG_MIME, String(mediaId))
  if (media) {
    try {
      dataTransfer.setData(
        PAGE_COMPOSER_MEDIA_DRAG_PAYLOAD_MIME,
        JSON.stringify({
          id: mediaId,
          media,
        } satisfies PageComposerMediaDragPayload),
      )
    } catch {
      // Ignore serialization failures and fall back to the id-only payload.
    }
  }
  dataTransfer.effectAllowed = 'copy'
}

export function readPageComposerMediaDragId(dataTransfer: DataTransfer): null | number {
  const raw =
    dataTransfer.getData(PAGE_COMPOSER_MEDIA_DRAG_MIME).trim() || dataTransfer.getData('text/plain').trim()
  if (!raw) {
    return null
  }
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

export function readPageComposerMediaDragPayload(dataTransfer: DataTransfer): null | PageComposerMediaDragPayload {
  try {
    const raw = dataTransfer.getData(PAGE_COMPOSER_MEDIA_DRAG_PAYLOAD_MIME).trim()
    if (!raw) {
      const id = readPageComposerMediaDragId(dataTransfer)
      return id === null ? null : { id }
    }

    const parsed = JSON.parse(raw) as PageComposerMediaDragPayload
    if (!parsed || !Number.isInteger(parsed.id) || parsed.id <= 0) {
      return null
    }

    return parsed
  } catch {
    const id = readPageComposerMediaDragId(dataTransfer)
    return id === null ? null : { id }
  }
}
