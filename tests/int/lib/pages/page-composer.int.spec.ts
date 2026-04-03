import { describe, expect, it } from 'vitest'

import {
  appendPageLayoutSection,
  buildPageComposerNotices,
  buildPageComposerSectionSummaries,
  createPageComposerSectionTemplate,
  duplicatePageLayoutSection,
  frontendPathToPageSlug,
  normalizePageComposerLayoutForSave,
  pageSlugToFrontendPath,
  removePageLayoutSection,
} from '@/lib/pages/pageComposer'

describe('page composer helpers', () => {
  it('maps frontend paths back to page slugs', () => {
    expect(frontendPathToPageSlug('/')).toBe('home')
    expect(frontendPathToPageSlug('/about')).toBe('about')
    expect(frontendPathToPageSlug('/nested/path')).toBeNull()
    expect(pageSlugToFrontendPath('home')).toBe('/')
    expect(pageSlugToFrontendPath('about')).toBe('/about')
  })

  it('creates reusable service-grid templates', () => {
    const block = createPageComposerSectionTemplate('service-feature-cards')

    expect(block.blockType).toBe('serviceGrid')
    if (block.blockType !== 'serviceGrid') {
      throw new Error('Expected a service-grid template.')
    }

    expect(block.displayVariant).toBe('featureCards')
    expect(block.services).toHaveLength(3)
  })

  it('appends, duplicates, and removes page sections', () => {
    const appended = appendPageLayoutSection({
      layout: [],
      template: 'service-interactive',
    })

    expect(appended).toHaveLength(1)

    const duplicated = duplicatePageLayoutSection({
      index: 0,
      layout: appended,
    })

    expect(duplicated).toHaveLength(2)

    const removed = removePageLayoutSection({
      index: 0,
      layout: duplicated,
    })

    expect(removed).toHaveLength(1)
  })

  it('summarizes reusable service sections for the composer list', () => {
    const summaries = buildPageComposerSectionSummaries([
      createPageComposerSectionTemplate('service-pricing-steps'),
    ] as never)

    expect(summaries[0]).toMatchObject({
      blockType: 'serviceGrid',
      label: 'How our pricing works',
      variant: 'pricingSteps',
    })
  })

  it('normalizes populated media relations before save', () => {
    expect(
      normalizePageComposerLayoutForSave([
        {
          blockType: 'serviceGrid',
          services: [
            {
              media: { id: 22 },
              name: 'House wash',
              summary: 'Exterior cleaning.',
            },
          ],
        },
        {
          blockType: 'mediaBlock',
          media: { id: 33 },
        },
      ] as never),
    ).toEqual([
      {
        blockType: 'serviceGrid',
        services: [
          {
            media: 22,
            name: 'House wash',
            summary: 'Exterior cleaning.',
          },
        ],
      },
      {
        blockType: 'mediaBlock',
        media: 33,
      },
    ])
  })

  it('builds composer notices for homepage, private pages, and shared pricing blocks', () => {
    const notices = buildPageComposerNotices({
      page: {
        _status: 'draft',
        slug: 'home',
        visibility: 'private',
      },
      selectedBlock: {
        blockType: 'pricingTable',
        dataSource: 'global',
      } as never,
    })

    expect(notices.map((notice) => notice.id)).toEqual(
      expect.arrayContaining(['page-local-scope', 'home-route', 'private-visibility', 'pricing-global-source']),
    )
  })
})
