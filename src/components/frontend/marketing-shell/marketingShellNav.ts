import type { MarketingNavLink } from '@/lib/marketing/public-shell'

export const FOOTER_ONLY_LABELS = new Set(['about', 'contact'])

export const DEFAULT_EXPLORE_LINKS: MarketingNavLink[] = [
  { label: 'Services', href: '/#services', external: false },
  { label: 'Pricing', href: '/#pricing', external: false },
  { label: 'Get quote', href: '/#instant-quote', external: false },
]

export function normalizeHref(href: string) {
  return href.endsWith('/') && href !== '/' ? href.slice(0, -1) : href
}

export function normalizeLabel(label: string) {
  return label.trim().toLowerCase()
}

export function dedupeLinks(items: MarketingNavLink[]) {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = `${normalizeHref(item.href)}::${normalizeLabel(item.label)}`
    if (seen.has(key)) {
      return false
    }

    if (!item.external && item.href === '/#instant-quote') {
      const quoteKey = 'quote-anchor'
      if (seen.has(quoteKey)) {
        return false
      }
      seen.add(quoteKey)
    }

    seen.add(key)
    return true
  })
}

export function buildExploreLinks(primaryLinks: MarketingNavLink[]) {
  const filtered = dedupeLinks(
    primaryLinks.filter((item) => {
      const label = normalizeLabel(item.label)
      if (label === 'home' || FOOTER_ONLY_LABELS.has(label)) {
        return false
      }
      return true
    }),
  )

  return filtered.length > 0 ? filtered : DEFAULT_EXPLORE_LINKS
}

export function buildFooterLinks(primaryLinks: MarketingNavLink[], footerLinks: MarketingNavLink[]) {
  const promotedPrimaryLinks = primaryLinks.filter((item) => FOOTER_ONLY_LABELS.has(normalizeLabel(item.label)))
  return dedupeLinks([...promotedPrimaryLinks, ...footerLinks])
}

export function isLinkActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }

  const normalized = href.split('#')[0]
  if (!normalized) {
    return pathname === '/'
  }

  return pathname === normalized || pathname.startsWith(`${normalized}/`)
}
