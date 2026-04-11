import type { Media, ServiceGridBlock } from '@/payload-types'

import type {
  BlockLabLiveBlockSummary,
  BlockLabPageSummary,
  BlockLabServiceGridPreviewInput,
} from './liveBlockCatalog'

function relationId(value: unknown): null | number {
  if (value && typeof value === 'object' && 'id' in value) {
    const record = value as { id?: null | number | string }
    return typeof record.id === 'number' ? record.id : null
  }

  return typeof value === 'number' ? value : null
}

function isMediaRecord(value: unknown): value is Media {
  return Boolean(value && typeof value === 'object' && 'url' in value)
}

function resolveServiceGridMediaPreview(
  media: null | number | Media | undefined,
): null | BlockLabServiceGridPreviewInput['block']['services'][number]['media'] {
  if (!isMediaRecord(media)) {
    return null
  }

  return {
    alt: media.alt || undefined,
    badge: media.filename || undefined,
    credit: media.mimeType || undefined,
    src:
      media.url ||
      media.sizes?.large?.url ||
      media.sizes?.medium?.url ||
      media.sizes?.small?.url ||
      media.thumbnailURL ||
      undefined,
  }
}

export function createServiceGridPreviewInput(
  block: ServiceGridBlock,
): BlockLabServiceGridPreviewInput {
  return {
    block: {
      blockType: 'serviceGrid',
      displayVariant:
        block.displayVariant === 'featureCards' ||
        block.displayVariant === 'pricingSteps'
          ? block.displayVariant
          : 'interactive',
      eyebrow: block.eyebrow || undefined,
      heading: block.heading,
      intro: block.intro || undefined,
      services:
        block.services?.map((service, index) => ({
          eyebrow: service.eyebrow || undefined,
          highlights:
            service.highlights?.map((highlight) => ({
              text: highlight.text,
            })) || undefined,
          id: service.id || `service-${index + 1}`,
          media: resolveServiceGridMediaPreview(service.media),
          name: service.name,
          pricingHint: service.pricingHint || undefined,
          summary: service.summary,
        })) || [],
    },
    fixtureId:
      block.displayVariant === 'featureCards' ||
      block.displayVariant === 'pricingSteps'
        ? block.displayVariant
        : 'interactive',
  }
}

export function summarizeServiceGridBlock(args: {
  block: ServiceGridBlock
  blockIndex: number
  livePreviewComponentId: string
  page: BlockLabPageSummary
}): BlockLabLiveBlockSummary {
  const { block, blockIndex, livePreviewComponentId, page } = args

  return {
    blockIndex,
    blockInstanceId: block.id,
    blockLabel: block.heading?.trim() || `Service grid ${blockIndex + 1}`,
    blockType: block.blockType,
    composerReusable: block.composerReusable
      ? {
          key: block.composerReusable.key,
          label: block.composerReusable.label,
          mode: block.composerReusable.mode,
          sourceType: block.composerReusable.sourceType,
        }
      : null,
    displayVariant: block.displayVariant || 'interactive',
    hidden: Boolean(block.isHidden),
    livePreviewComponentId,
    mediaSlotSummary:
      block.services?.map((service, index) => ({
        hasMedia: relationId(service.media) !== null || isMediaRecord(service.media),
        index,
        label: service.name?.trim() || `Service row ${index + 1}`,
        mediaId: relationId(service.media),
      })) || [],
    page,
    previewInput: createServiceGridPreviewInput(block),
    previewable: true,
    summary: block.intro || null,
  }
}
