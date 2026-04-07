'use client'

import type { ServiceGridBlock } from '@/payload-types'

export type MediaAction = 'create-and-swap' | 'generate-and-swap' | 'swap-existing-reference'

export type MediaKind = 'image' | 'video'

export type MediaLibraryItem = {
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

export function getMediaKindFromMimeType(mimeType: null | string | undefined): MediaKind {
  return mimeType?.startsWith('video/') ? 'video' : 'image'
}

export type MediaSectionSummary = null | Pick<ServiceGridBlock, 'heading'>
