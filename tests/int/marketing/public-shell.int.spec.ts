import { describe, expect, it } from 'vitest'

import {
  buildMarketingNavLinks,
  extractLexicalPlainText,
  resolveCmsLinkHref,
} from '@/lib/marketing/public-shell'

describe('public shell helpers', () => {
  it('resolves reference and custom CMS links into hrefs', () => {
    expect(
      resolveCmsLinkHref({
        type: 'reference',
        label: 'About',
        reference: {
          relationTo: 'pages',
          value: { slug: 'about' },
        },
      } as never),
    ).toBe('/about')

    expect(
      resolveCmsLinkHref({
        type: 'custom',
        label: 'Quote',
        url: '/#instant-quote',
      } as never),
    ).toBe('/#instant-quote')
  })

  it('normalizes nav items and drops empty links', () => {
    const links = buildMarketingNavLinks([
      { link: { type: 'custom', label: 'Home', url: '/' } },
      { link: { type: 'custom', label: '   ', url: '/ignored' } },
      { link: { type: 'custom', label: 'Contact', url: 'https://example.com' } },
    ] as never)

    expect(links).toEqual([
      { label: 'Home', href: '/', external: false },
      { label: 'Contact', href: 'https://example.com', external: true },
    ])
  })

  it('extracts readable plain text from lexical content', () => {
    expect(
      extractLexicalPlainText({
        root: {
          children: [
            {
              type: 'paragraph',
              children: [{ text: 'Clear scope.' }, { text: ' Visible results.' }],
            },
          ],
        },
      }),
    ).toBe('Clear scope. Visible results.')
  })
})
