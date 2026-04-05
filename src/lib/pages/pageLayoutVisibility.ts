import type { Page } from '@/payload-types'

type LayoutBlock = Page['layout'][number]

export function isPageLayoutBlockHidden(block: LayoutBlock | null | undefined): boolean {
  return Boolean(block?.isHidden)
}

export function getVisiblePageLayoutBlocks(
  layout: null | Page['layout'] | undefined,
): Page['layout'] {
  return ((layout || []).filter((block) => !isPageLayoutBlockHidden(block)) as Page['layout']) || []
}
