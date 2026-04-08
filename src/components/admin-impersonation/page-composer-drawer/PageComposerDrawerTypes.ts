import type { MediaDevtoolsSummary } from '@/lib/media/pageMediaDevtools'
import type {
  PageComposerDocument,
  PageComposerPageSummary,
  PageComposerVersionSummary,
} from '@/lib/pages/pageComposer'
import type { ReusableAwareLayoutBlock } from '@/lib/pages/pageComposerReusableBlocks'
import type { Media, ServiceGridBlock } from '@/payload-types'

export type MediaAction =
  | 'create-and-swap'
  | 'create-only'
  | 'delete-media'
  | 'generate-and-swap'
  | 'generate-only'
  | 'replace-existing'
  | 'swap-existing-reference'
export type SavingAction = 'publish-page' | 'save-draft'
export type ServiceGridService = NonNullable<ServiceGridBlock['services']>[number]
export type PricingPlan = NonNullable<NonNullable<Extract<ReusableAwareLayoutBlock, { blockType: 'pricingTable' }>['inlinePlans']>>[number]

export type MediaLibraryItem = {
  alt: null | string
  filename: null | string
  id: number
  media: Media
  mimeType: null | string
  previewUrl: null | string
  updatedAt: string
}

export type BlockLibraryMode = 'insert' | 'replace'

export type SectionMediaSlot = {
  label: string
  media: MediaDevtoolsSummary | null
  mediaId: number | null
  mimeType: null | string
  relationPath: string
}

export type PageComposerResponse = {
  error?: string
  page?: PageComposerDocument
  pages?: PageComposerPageSummary[]
  versions?: PageComposerVersionSummary[]
}

export type PageComposerDrawerMedia = Media | null | number | undefined
