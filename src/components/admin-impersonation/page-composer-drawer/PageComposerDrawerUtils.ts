import { isUnknownRecord } from '@/lib/is-unknown-record'

import type { Media } from '@/payload-types'

import type { PageComposerDrawerMedia, ServiceGridService } from './PageComposerDrawerTypes'

export function createServiceGridLaneDraft(index: number): ServiceGridService {
  return {
    eyebrow: `Lane ${index + 1}`,
    highlights: [{ text: 'Replace this lane proof with a real detail for the service.' }],
    name: `Service lane ${index + 1}`,
    pricingHint: '',
    summary: 'Describe what happens in this lane and why it matters.',
  }
}

export function asMedia(value: PageComposerDrawerMedia): Media | null {
  return isUnknownRecord(value) ? (value as Media) : null
}

export function getFileKind(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image'
}
