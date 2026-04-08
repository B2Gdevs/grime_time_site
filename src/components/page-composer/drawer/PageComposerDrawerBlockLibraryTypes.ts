import type {
  PageComposerBlockDefinition,
  PageComposerInsertableBlockType,
} from '@/lib/pages/pageComposerBlockRegistry'

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
  | 'testimonials'

export const blockLibraryCategoryOptions: Array<{ label: string; value: BlockLibraryCategory }> = [
  { label: 'All', value: 'all' },
  { label: 'Hero', value: 'hero' },
  { label: 'Services', value: 'services' },
  { label: 'Content', value: 'content' },
  { label: 'Media', value: 'media' },
  { label: 'Testimonials', value: 'testimonials' },
  { label: 'Apps', value: 'apps' },
]

export function resolveBlockLibraryCategory(type: string): Exclude<BlockLibraryCategory, 'all' | 'hero'> {
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
  insertRegisteredBlock: (type: PageComposerInsertableBlockType) => void
  insertReusablePreset: (args: { key: string; mode: 'detached' | 'linked' }) => void
  setBlockLibraryQuery: (value: string) => void
}
