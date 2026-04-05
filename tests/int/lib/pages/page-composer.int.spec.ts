import { describe, expect, it } from 'vitest'

import {
  appendPageLayoutSection,
  buildPageComposerValidationSummary,
  countPageComposerChangedBlocks,
  buildPageComposerNotices,
  buildPageComposerSectionSummaries,
  createPageComposerSectionTemplate,
  duplicatePageLayoutSection,
  frontendPathToPageSlug,
  insertPageLayoutRegisteredBlock,
  normalizePageComposerLayoutForSave,
  pageSlugToFrontendPath,
  removePageLayoutSection,
  togglePageLayoutSectionHidden,
} from '@/lib/pages/pageComposer'
import { createReusablePresetBlock, resolvePageComposerReusableBlock } from '@/lib/pages/pageComposerReusableBlocks'

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
      badges: ['static', 'reusable'],
      blockType: 'serviceGrid',
      category: 'static',
      hidden: false,
      label: 'How our pricing works',
      variant: 'pricingSteps',
    })
  })

  it('toggles block visibility and exposes a hidden badge in summaries', () => {
    const hiddenLayout = togglePageLayoutSectionHidden({
      index: 0,
      layout: [createPageComposerSectionTemplate('service-interactive')] as never,
    })

    expect(hiddenLayout[0]).toMatchObject({
      blockType: 'serviceGrid',
      isHidden: true,
    })

    const summaries = buildPageComposerSectionSummaries(hiddenLayout)
    expect(summaries[0]).toMatchObject({
      badges: ['static', 'reusable', 'hidden'],
      hidden: true,
    })
  })

  it('inserts registered blocks at an explicit position', () => {
    const layout = insertPageLayoutRegisteredBlock({
      index: 0,
      layout: [
        {
          blockType: 'pricingTable',
          dataSource: 'global',
          heading: 'Pricing',
          inlinePlans: [],
        },
      ] as never,
      type: 'serviceGrid',
    })

    expect(layout).toHaveLength(2)
    expect(layout[0]).toMatchObject({
      blockType: 'serviceGrid',
      displayVariant: 'interactive',
    })
    expect(layout[1]).toMatchObject({
      blockType: 'pricingTable',
    })
  })

  it('inserts a custom-html block through the registered block path', () => {
    const layout = insertPageLayoutRegisteredBlock({
      index: 0,
      layout: [],
      type: 'customHtml',
    })

    expect(layout[0]).toMatchObject({
      blockType: 'customHtml',
      label: 'Custom HTML',
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

  it('builds a notice for a hidden selected block', () => {
    const notices = buildPageComposerNotices({
      page: {
        _status: 'draft',
        slug: 'about',
        visibility: 'public',
      },
      selectedBlock: {
        blockType: 'serviceGrid',
        isHidden: true,
      } as never,
    })

    expect(notices.map((notice) => notice.id)).toContain('selected-block-hidden')
  })

  it('resolves linked reusable presets for section summaries', () => {
    const linked = createReusablePresetBlock({
      key: 'service-feature-cards',
      mode: 'linked',
    })

    if (!linked) {
      throw new Error('Expected linked reusable preset.')
    }

    const summaries = buildPageComposerSectionSummaries([linked] as never)

    expect(summaries[0]).toMatchObject({
      badges: expect.arrayContaining(['linked', 'reusable']),
      label: 'Featured services',
    })
    expect(resolvePageComposerReusableBlock(linked)).toMatchObject({
      blockType: 'serviceGrid',
      heading: 'What we do',
    })
  })

  it('counts changed blocks relative to the last saved draft', () => {
    const baseline = [createPageComposerSectionTemplate('service-interactive')] as never
    const draft = duplicatePageLayoutSection({
      index: 0,
      layout: baseline,
    })

    expect(
      countPageComposerChangedBlocks({
        baselineLayout: baseline,
        draftLayout: draft,
      }),
    ).toBe(1)
  })

  it('builds publish validation issues for empty layout, inline pricing, and empty custom html', () => {
    const summary = buildPageComposerValidationSummary({
      page: {
        _status: 'draft',
        layout: [
          {
            blockType: 'pricingTable',
            dataSource: 'inline',
            inlinePlans: [],
          },
          {
            blockType: 'customHtml',
            html: '',
            label: 'Embed',
          },
        ] as never,
        slug: '',
        title: '',
        visibility: 'public',
      },
    })

    expect(summary.issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining(['missing-title', 'missing-slug', 'pricing-inline-0', 'custom-html-empty-1']),
    )
  })
})
