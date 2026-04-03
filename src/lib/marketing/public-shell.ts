import type { Footer, Header, Media } from '@/payload-types'

export type MarketingNavLink = {
  external: boolean
  href: string
  label: string
}

type LinkValue = {
  slug?: string | null
}

type CmsLinkLike = NonNullable<Header['navItems']>[number]['link']

export function resolveCmsLinkHref(link: CmsLinkLike): string {
  if (
    link.type === 'reference' &&
    typeof link.reference?.value === 'object' &&
    link.reference.value &&
    'slug' in link.reference.value
  ) {
    const value = link.reference.value as LinkValue
    const slug = value.slug?.trim()

    if (!slug) {
      return ''
    }

    const prefix = link.reference.relationTo !== 'pages' ? `/${link.reference.relationTo}` : ''
    return `${prefix}/${slug}`
  }

  return link.url?.trim() || ''
}

export function buildMarketingNavLinks(
  items: Header['navItems'] | Footer['navItems'] | null | undefined,
): MarketingNavLink[] {
  if (!items?.length) {
    return []
  }

  return items
    .map(({ link }) => {
      const href = resolveCmsLinkHref(link as CmsLinkLike)

      if (!href || !link.label?.trim()) {
        return null
      }

      return {
        external: /^https?:\/\//.test(href),
        href,
        label: link.label.trim(),
      }
    })
    .filter((item): item is MarketingNavLink => item !== null)
}

function extractLexicalNodeText(node: unknown): string[] {
  if (!node || typeof node !== 'object') {
    return []
  }

  const record = node as Record<string, unknown>
  const parts: string[] = []

  if (typeof record.text === 'string' && record.text.trim()) {
    parts.push(record.text.trim())
  }

  if (record.root && typeof record.root === 'object') {
    parts.push(...extractLexicalNodeText(record.root))
  }

  if (Array.isArray(record.children)) {
    for (const child of record.children) {
      parts.push(...extractLexicalNodeText(child))
    }
  }

  return parts
}

export function extractLexicalPlainText(value: unknown): string {
  const parts = extractLexicalNodeText(value)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

export function getMediaUrl(media: Media | number | null | undefined): string | null {
  if (!media || typeof media === 'number') {
    return null
  }

  return media.sizes?.large?.url || media.sizes?.medium?.url || media.sizes?.small?.url || media.url || null
}
