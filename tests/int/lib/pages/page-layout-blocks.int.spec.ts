import { describe, expect, it } from 'vitest'

import { buildPageDocumentBlocksForSave, normalizePageLayoutBlocks } from '@/lib/pages/pageLayoutBlocks'

describe('page layout block normalization', () => {
  it('upgrades the legacy home hero into ordered layout blocks', () => {
    const layout = normalizePageLayoutBlocks({
      page: {
        hero: {
          eyebrow: 'Grime Time exterior cleaning',
          headlinePrimary: 'Clear scope.',
          media: 11,
          type: 'lowImpact',
        },
        layout: [
          {
            blockType: 'serviceGrid',
            heading: 'What we do',
            services: [],
          },
        ],
      } as never,
      pagePath: '/',
    })

    expect(layout).toEqual([
      {
        blockType: 'heroBlock',
        eyebrow: 'Grime Time exterior cleaning',
        headlinePrimary: 'Clear scope.',
        media: 11,
        type: 'lowImpact',
      },
      {
        blockType: 'serviceGrid',
        heading: 'What we do',
        services: [],
      },
      {
        blockType: 'serviceEstimator',
      },
    ])
  })

  it('does not inject the estimator on non-home routes', () => {
    const layout = normalizePageLayoutBlocks({
      page: {
        hero: {
          headlinePrimary: 'About the crew',
          type: 'highImpact',
        },
        layout: [],
      } as never,
      pagePath: '/about',
    })

    expect(layout).toEqual([
      {
        blockType: 'heroBlock',
        headlinePrimary: 'About the crew',
        type: 'highImpact',
      },
    ])
  })

  it('mirrors the hero block back onto the legacy page hero payload when saving', () => {
    expect(
      buildPageDocumentBlocksForSave({
        layout: [
          {
            blockType: 'heroBlock',
            headlinePrimary: 'Clear scope.',
            media: 11,
            type: 'lowImpact',
          },
          {
            blockType: 'serviceEstimator',
          },
        ] as never,
      }),
    ).toEqual({
      hero: {
        headlinePrimary: 'Clear scope.',
        media: 11,
        type: 'lowImpact',
      },
      layout: [
        {
          blockType: 'heroBlock',
          headlinePrimary: 'Clear scope.',
          media: 11,
          type: 'lowImpact',
        },
        {
          blockType: 'serviceEstimator',
        },
      ],
    })
  })
})
