import type { Media, Page } from '@/payload-types'

export type PageMediaReference = {
  label: string
  media: null | {
    alt: null | string
    filename: null | string
    id: number
    previewUrl: null | string
    updatedAt: string
  }
  mediaId: null | number
  pageId: number
  pagePath: string
  pageSlug: string
  pageTitle: string
  relationPath: string
}

type PageLike = Pick<Page, 'hero' | 'layout'> &
  Partial<Pick<Page, 'id' | 'slug' | 'title'>>

function asMedia(value: Media | null | number | undefined): Media | null {
  return value && typeof value === 'object' ? value : null
}

function getMediaPreviewUrl(media: Media | null): null | string {
  if (!media) {
    return null
  }

  return media.sizes?.thumbnail?.url || media.thumbnailURL || media.url || null
}

function buildMediaSummary(media: Media | null): PageMediaReference['media'] {
  if (!media) {
    return null
  }

  return {
    alt: media.alt || null,
    filename: media.filename || null,
    id: Number(media.id),
    previewUrl: getMediaPreviewUrl(media),
    updatedAt: media.updatedAt,
  }
}

function getBlockLabel(block: Page['layout'][number], blockIndex: number): string {
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
  const heroMedia = asMedia(page.hero?.media)

  if (heroMedia) {
    refs.push({
      label: 'Hero image',
      media: buildMediaSummary(heroMedia),
      mediaId: Number(heroMedia.id),
      pageId,
      pagePath,
      pageSlug,
      pageTitle,
      relationPath: 'hero.media',
    })
  }

  for (const [blockIndex, block] of (page.layout || []).entries()) {
    if (block.blockType === 'mediaBlock') {
      const blockMedia = asMedia(block.media)

      if (blockMedia) {
        refs.push({
          label: getBlockLabel(block, blockIndex),
          media: buildMediaSummary(blockMedia),
          mediaId: Number(blockMedia.id),
          pageId,
          pagePath,
          pageSlug,
          pageTitle,
          relationPath: `layout.${blockIndex}.media`,
        })
      }

      continue
    }

    if (block.blockType !== 'serviceGrid' || !block.services?.length) {
      continue
    }

    for (const [serviceIndex, service] of block.services.entries()) {
      const rowMedia = asMedia(service.media)

      if (!rowMedia) {
        continue
      }

      refs.push({
        label: `${getBlockLabel(block, blockIndex)}: ${service.name}`,
        media: buildMediaSummary(rowMedia),
        mediaId: Number(rowMedia.id),
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

function cloneLayout(page: Pick<Page, 'layout'>): Page['layout'] {
  return [...(page.layout || [])]
}

export function buildPageMediaUpdateData(args: {
  mediaId: number
  page: Pick<Page, 'hero' | 'layout'>
  relationPath: string
}): Partial<Pick<Page, 'hero' | 'layout'>> {
  const { mediaId, page, relationPath } = args

  if (relationPath === 'hero.media') {
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

    if (!target || target.blockType !== 'mediaBlock') {
      throw new Error(`Unsupported page media path: ${relationPath}`)
    }

    layout[blockIndex] = {
      ...target,
      media: mediaId,
    }

    return { layout }
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
