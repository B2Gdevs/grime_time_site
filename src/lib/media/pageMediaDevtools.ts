import { createLegacyHeroGroupFromBlock, normalizePageLayoutBlocks } from '@/lib/pages/pageLayoutBlocks'
import type { Media, Page } from '@/payload-types'

export type MediaDevtoolsSummary = {
  alt: null | string
  filename: null | string
  id: number
  mimeType: null | string
  previewUrl: null | string
  updatedAt: string
}

export type PageMediaReference = {
  label: string
  media: null | MediaDevtoolsSummary
  mediaId: null | number
  pageId: number
  pagePath: string
  pageSlug: string
  pageTitle: string
  relationPath: string
}

type PageLike = Pick<Page, 'hero' | 'layout'> &
  Partial<Pick<Page, 'id' | 'slug' | 'title'>>

function pagePathFromSlug(slug: null | string | undefined): string {
  const trimmed = slug?.trim() || ''
  if (!trimmed || trimmed === 'home') {
    return '/'
  }

  return `/${trimmed}`
}

function asMedia(value: Media | null | number | undefined): Media | null {
  return value && typeof value === 'object' ? value : null
}

function getMediaPreviewUrl(media: Media | null): null | string {
  if (!media) {
    return null
  }

  return media.sizes?.thumbnail?.url || media.thumbnailURL || media.url || null
}

export function buildMediaDevtoolsSummary(media: Media | null): null | MediaDevtoolsSummary {
  if (!media) {
    return null
  }

  return {
    alt: media.alt || null,
    filename: media.filename || null,
    id: Number(media.id),
    mimeType: media.mimeType || null,
    previewUrl: getMediaPreviewUrl(media),
    updatedAt: media.updatedAt,
  }
}

function getBlockLabel(block: Page['layout'][number], blockIndex: number): string {
  if (block.blockType === 'heroBlock') {
    return 'Hero'
  }

  if (block.blockType === 'serviceEstimator') {
    return 'Service estimator'
  }

  if (block.blockType === 'serviceGrid') {
    return block.heading || `Service section ${blockIndex + 1}`
  }

  return block.blockName?.trim() || `${block.blockType} block ${blockIndex + 1}`
}

export function collectPageMediaReferences(args: {
  page: PageLike
  pagePath: string
}): PageMediaReference[] {
  const refs: PageMediaReference[] = []
  const { page, pagePath } = args
  const pageId = Number(page.id || 0)
  const pageSlug = page.slug || ''
  const pageTitle = page.title || page.slug || 'Untitled page'
  const layout = normalizePageLayoutBlocks({ page, pagePath })

  for (const [blockIndex, block] of layout.entries()) {
    if (block.blockType === 'mediaBlock' || block.blockType === 'heroBlock') {
      const blockMedia = asMedia(block.media)

      refs.push({
        label: block.blockType === 'heroBlock' ? 'Hero image' : getBlockLabel(block, blockIndex),
        media: blockMedia ? buildMediaDevtoolsSummary(blockMedia) : null,
        mediaId: blockMedia ? Number(blockMedia.id) : null,
        pageId,
        pagePath,
        pageSlug,
        pageTitle,
        relationPath: `layout.${blockIndex}.media`,
      })

      continue
    }

    if (block.blockType !== 'serviceGrid' || !block.services?.length) {
      continue
    }

    for (const [serviceIndex, service] of block.services.entries()) {
      const rowMedia = asMedia(service.media)
      const rowLabel = service.name?.trim() || `Row ${serviceIndex + 1}`

      refs.push({
        label: `${getBlockLabel(block, blockIndex)}: ${rowLabel}`,
        media: rowMedia ? buildMediaDevtoolsSummary(rowMedia) : null,
        mediaId: rowMedia ? Number(rowMedia.id) : null,
        pageId,
        pagePath,
        pageSlug,
        pageTitle,
        relationPath: `layout.${blockIndex}.services.${serviceIndex}.media`,
      })
    }
  }

  return refs
}

function cloneLayout(page: Pick<Page, 'hero' | 'layout'> & Partial<Pick<Page, 'slug'>>): Page['layout'] {
  return normalizePageLayoutBlocks({
    page,
    pagePath: pagePathFromSlug(page.slug),
  })
}

export function buildPageMediaUpdateData(args: {
  mediaId: number
  page: Pick<Page, 'hero' | 'layout'> & Partial<Pick<Page, 'slug'>>
  relationPath: string
}): Partial<Pick<Page, 'hero' | 'layout'>> {
  const { mediaId, page, relationPath } = args

  if (relationPath === 'hero.media') {
    const layout = normalizePageLayoutBlocks({ page, pagePath: pagePathFromSlug(page.slug) })
    const heroIndex = layout.findIndex((block) => block.blockType === 'heroBlock')

    if (heroIndex >= 0) {
      const target = layout[heroIndex]

      if (target?.blockType === 'heroBlock') {
        layout[heroIndex] = {
          ...target,
          media: mediaId,
        }
      }

      return {
        hero: createLegacyHeroGroupFromBlock({
          block: layout[heroIndex]?.blockType === 'heroBlock' ? layout[heroIndex] : null,
          fallback: page.hero,
        }),
        layout,
      }
    }

    return {
      hero: {
        ...page.hero,
        media: mediaId,
      },
    }
  }

  const layoutMediaMatch = /^layout\.(\d+)\.media$/.exec(relationPath)
  if (layoutMediaMatch) {
    const blockIndex = Number(layoutMediaMatch[1])
    const layout = cloneLayout(page)
    const target = layout[blockIndex]

    if (!target || (target.blockType !== 'mediaBlock' && target.blockType !== 'heroBlock')) {
      throw new Error(`Unsupported page media path: ${relationPath}`)
    }

    layout[blockIndex] = {
      ...target,
      media: mediaId,
    }

    return target.blockType === 'heroBlock'
      ? {
          hero: createLegacyHeroGroupFromBlock({
            block: layout[blockIndex]?.blockType === 'heroBlock' ? layout[blockIndex] : null,
            fallback: page.hero,
          }),
          layout,
        }
      : { layout }
  }

  const serviceMediaMatch = /^layout\.(\d+)\.services\.(\d+)\.media$/.exec(relationPath)
  if (serviceMediaMatch) {
    const blockIndex = Number(serviceMediaMatch[1])
    const serviceIndex = Number(serviceMediaMatch[2])
    const layout = cloneLayout(page)
    const target = layout[blockIndex]

    if (!target || target.blockType !== 'serviceGrid' || !target.services?.[serviceIndex]) {
      throw new Error(`Unsupported page media path: ${relationPath}`)
    }

    const services = [...target.services]
    services[serviceIndex] = {
      ...services[serviceIndex],
      media: mediaId,
    }

    layout[blockIndex] = {
      ...target,
      services,
    }

    return { layout }
  }

  throw new Error(`Unsupported page media path: ${relationPath}`)
}
