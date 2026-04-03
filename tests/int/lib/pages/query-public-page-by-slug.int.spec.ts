import { describe, expect, it } from 'vitest'

import { buildPublicPageWhere } from '@/lib/pages/queryPublicPageBySlug'

describe('public page query filters', () => {
  it('keeps visibility filtering for public visitors', () => {
    expect(
      buildPublicPageWhere({
        includePrivate: false,
        slug: 'about',
      }),
    ).toEqual({
      and: [
        {
          slug: {
            equals: 'about',
          },
        },
        {
          visibility: {
            equals: 'public',
          },
        },
      ],
    })
  })

  it('drops the visibility restriction for staff preview queries', () => {
    expect(
      buildPublicPageWhere({
        includePrivate: true,
        slug: 'about',
      }),
    ).toEqual({
      slug: {
        equals: 'about',
      },
    })
  })
})
