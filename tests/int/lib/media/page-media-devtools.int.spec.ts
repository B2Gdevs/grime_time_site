import { describe, expect, it } from 'vitest'

import { buildPageMediaUpdateData, collectPageMediaReferences } from '@/lib/media/pageMediaDevtools'

const baseMedia = {
  createdAt: '2026-04-01T00:00:00.000Z',
  id: 11,
  updatedAt: '2026-04-01T00:00:00.000Z',
}

describe('page media devtools helpers', () => {
  it('collects hero, service-grid, and media-block references for a page', () => {
    const refs = collectPageMediaReferences({
      page: {
        hero: {
          media: {
            ...baseMedia,
            alt: 'Hero',
            filename: 'hero.jpg',
            url: '/media/hero.jpg',
          },
          type: 'highImpact',
        },
        id: 7,
        layout: [
          {
            blockType: 'serviceGrid',
            heading: 'What we do',
            services: [
              {
                media: {
                  ...baseMedia,
                  id: 22,
                  alt: 'Driveway',
                  filename: 'driveway.jpg',
                  url: '/media/driveway.jpg',
                },
                name: 'Driveway cleaning',
                summary: 'Concrete lane.',
              },
            ],
          },
          {
            blockType: 'mediaBlock',
            media: {
              ...baseMedia,
              id: 33,
              alt: 'Proof',
              filename: 'proof.jpg',
              url: '/media/proof.jpg',
            },
          },
        ],
        slug: 'home',
        title: 'Home',
      } as never,
      pagePath: '/',
    })

    expect(refs.map((ref) => ref.relationPath)).toEqual([
      'hero.media',
      'layout.0.services.0.media',
      'layout.1.media',
    ])
    expect(refs[1]?.label).toBe('What we do: Driveway cleaning')
    expect(refs[2]?.mediaId).toBe(33)
  })

  it('builds partial page update payloads for hero and service-grid references', () => {
    const page = {
      hero: {
        media: 11,
        type: 'highImpact',
      },
      layout: [
        {
          blockType: 'serviceGrid',
          heading: 'What we do',
          services: [
            {
              media: 22,
              name: 'House wash',
              summary: 'Exterior cleaning.',
            },
          ],
        },
      ],
    } as never

    expect(
      buildPageMediaUpdateData({
        mediaId: 91,
        page,
        relationPath: 'hero.media',
      }),
    ).toEqual({
      hero: {
        media: 91,
        type: 'highImpact',
      },
    })

    expect(
      buildPageMediaUpdateData({
        mediaId: 92,
        page,
        relationPath: 'layout.0.services.0.media',
      }),
    ).toEqual({
      layout: [
        {
          blockType: 'serviceGrid',
          heading: 'What we do',
          services: [
            {
              media: 92,
              name: 'House wash',
              summary: 'Exterior cleaning.',
            },
          ],
        },
      ],
    })
  })

  it('rejects unsupported relation paths', () => {
    expect(() =>
      buildPageMediaUpdateData({
        mediaId: 91,
        page: {
          hero: {
            media: 11,
            type: 'highImpact',
          },
          layout: [],
        } as never,
        relationPath: 'layout.5.services.0.media',
      }),
    ).toThrow(/Unsupported page media path/)
  })
})
