import type {
  PageComposerBlockDefinition,
  PageComposerInsertableBlockType,
} from '@/lib/pages/pageComposerBlockRegistry'
import type { SharedSectionRecord } from '@/lib/pages/sharedSections'

export type ReusablePreset = {
  blockType: string
  description: string
  key: string
  label: string
}

export type BlockLibraryCategory =
  | 'all'
  | 'apps'
  | 'content'
  | 'hero'
  | 'media'
  | 'services'
  | 'shared'
  | 'testimonials'

export const blockLibraryCategoryOptions: Array<{ label: string; value: BlockLibraryCategory }> = [
  { label: 'All', value: 'all' },
  { label: 'Hero', value: 'hero' },
  { label: 'Services', value: 'services' },
  { label: 'Content', value: 'content' },
  { label: 'Media', value: 'media' },
  { label: 'Testimonials', value: 'testimonials' },
  { label: 'Apps', value: 'apps' },
  { label: 'Shared', value: 'shared' },
]

export function resolveBlockLibraryCategory(type: string): Exclude<BlockLibraryCategory, 'all' | 'hero' | 'shared'> {
  if (type === 'heroBlock') {
    return 'content'
  }

  if (type === 'serviceGrid' || type === 'pricingTable') {
    return 'services'
  }

  if (type === 'mediaBlock') {
    return 'media'
  }

  if (type === 'testimonialsBlock') {
    return 'testimonials'
  }

  if (type === 'archive' || type === 'formBlock' || type === 'contactRequest' || type === 'customHtml' || type === 'serviceEstimator') {
    return 'apps'
  }

  return 'content'
}

export type PageComposerDrawerBlockLibraryProps = {
  blockLibraryMode: 'insert' | 'replace'
  blockLibraryQuery: string
  blockLibraryTargetIndex: null | number
  closeBlockLibrary: () => void
  filteredBlockDefinitions: PageComposerBlockDefinition[]
  filteredReusablePresets: ReusablePreset[]
  filteredSharedSections: SharedSectionRecord[]
  insertRegisteredBlock: (type: PageComposerInsertableBlockType) => void
  insertReusablePreset: (args: { key: string; mode: 'detached' | 'linked' }) => void
  insertSharedSection: (args: { item: SharedSectionRecord; mode: 'detached' | 'linked' }) => void
  openSharedSectionSourceEditor: (id: number) => void
  sharedSectionsLoading: boolean
  sharedSectionsStatus: null | string
  setBlockLibraryQuery: (value: string) => void
}
