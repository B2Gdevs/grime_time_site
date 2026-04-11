import type { Payload } from 'payload'

import { getPageComposerInsertableBlocks } from '@/lib/pages/pageComposerBlockRegistry'
import {
  isMarketingComposerPagePath,
  pageSlugToFrontendPath,
} from '@/lib/pages/pageComposer'
import type { Page } from '@/payload-types'

import { summarizeServiceGridBlock } from './serviceGridLivePreview'

export type BlockLabDefinitionSummary = {
  category: string
  description: string
  id: string
  keywords: string[]
  label: string
  livePreviewComponentId: null | string
  supportsInsert: boolean
  supportsNesting: boolean
  supportsReusable: boolean
}

export type BlockLabPageSummary = {
  id: number
  pagePath: string
  slug: string
  status: 'draft' | 'published'
  title: string
  updatedAt: string
  visibility: 'private' | 'public'
}

export type BlockLabServiceGridPreviewInput = {
  block: {
    blockType: 'serviceGrid'
    displayVariant: 'featureCards' | 'interactive' | 'pricingSteps'
    eyebrow?: string
    heading: string
    intro?: string
    services: Array<{
      eyebrow?: string
      highlights?: Array<{ text: string }>
      id: string
      media?: {
        alt?: string
        badge?: string
        credit?: string
        src?: string
      } | null
      name: string
      pricingHint?: string
      summary: string
    }>
  }
  fixtureId?: 'featureCards' | 'interactive' | 'pricingSteps'
}

export type BlockLabLiveBlockSummary = {
  blockIndex: number
  blockInstanceId?: string | null
  blockLabel: string
  blockType: string
  composerReusable?: {
    key?: string | null
    label?: string | null
    mode?: string | null
    sourceType?: string | null
  } | null
  displayVariant?: string | null
  hidden: boolean
  livePreviewComponentId: null | string
  mediaSlotSummary?: Array<{
    hasMedia: boolean
    index: number
    label: string
    mediaId: null | number
  }>
  page: BlockLabPageSummary
  previewInput?: BlockLabServiceGridPreviewInput
  previewable: boolean
  summary?: string | null
}

export type BlockLabCatalogResponse = {
  counts: {
    definitions: number
    pages: number
    previewableBlocks: number
    totalBlocks: number
  }
  definitions: BlockLabDefinitionSummary[]
  generatedAt: string
  liveBlocks: BlockLabLiveBlockSummary[]
  pages: BlockLabPageSummary[]
}

function toLivePreviewComponentId(blockType: string): null | string {
  if (blockType === 'serviceGrid') {
    return 'service-grid'
  }

  return null
}

function summarizePage(page: Page): BlockLabPageSummary {
  return {
    id: page.id,
    pagePath: pageSlugToFrontendPath(page.slug),
    slug: page.slug,
    status: page._status === 'published' ? 'published' : 'draft',
    title: page.title?.trim() || 'Untitled page',
    updatedAt: page.updatedAt,
    visibility: page.visibility,
  }
}

function summarizeLiveBlock(args: {
  block: Page['layout'][number]
  blockIndex: number
  page: BlockLabPageSummary
}): BlockLabLiveBlockSummary {
  const { block, blockIndex, page } = args
  const livePreviewComponentId = toLivePreviewComponentId(block.blockType)

  if (block.blockType === 'serviceGrid') {
    return summarizeServiceGridBlock({
      block,
      blockIndex,
      livePreviewComponentId: livePreviewComponentId ?? 'service-grid',
      page,
    })
  }

  const blockRecord = block as {
    blockName?: null | string
    composerReusable?: BlockLabLiveBlockSummary['composerReusable']
    id?: null | string
    isHidden?: null | boolean
  }

  return {
    blockIndex,
    blockInstanceId: blockRecord.id || null,
    blockLabel:
      blockRecord.blockName?.trim() || `${block.blockType} block ${blockIndex + 1}`,
    blockType: block.blockType,
    composerReusable: blockRecord.composerReusable || null,
    hidden: Boolean(blockRecord.isHidden),
    livePreviewComponentId,
    page,
    previewable: false,
    summary: null,
  }
}

export async function loadBlockLabCatalog(
  payload: Payload,
): Promise<BlockLabCatalogResponse> {
  const pageResult = await payload.find({
    collection: 'pages',
    depth: 2,
    draft: true,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: 'title',
  })

  const pages = (pageResult.docs as Page[])
    .map((page) => summarizePage(page))
    .filter((page) => isMarketingComposerPagePath(page.pagePath))

  const liveBlocks = (pageResult.docs as Page[])
    .map((page) => ({
      page,
      summary: summarizePage(page),
    }))
    .filter(({ summary }) => isMarketingComposerPagePath(summary.pagePath))
    .flatMap(({ page, summary }) =>
      (page.layout || []).map((block, blockIndex) =>
        summarizeLiveBlock({
          block,
          blockIndex,
          page: summary,
        }),
      ),
    )

  const definitions = getPageComposerInsertableBlocks().map((definition) => ({
    category: definition.category,
    description: definition.description,
    id: definition.id,
    keywords: [...definition.keywords],
    label: definition.label,
    livePreviewComponentId: toLivePreviewComponentId(definition.blockType),
    supportsInsert: definition.supportsInsert,
    supportsNesting: definition.supportsNesting,
    supportsReusable: definition.supportsReusable,
  }))

  return {
    counts: {
      definitions: definitions.length,
      pages: pages.length,
      previewableBlocks: liveBlocks.filter((block) => block.previewable).length,
      totalBlocks: liveBlocks.length,
    },
    definitions,
    generatedAt: new Date().toISOString(),
    liveBlocks,
    pages,
  }
}
