import {
  createPageComposerBlock,
  findPageComposerBlockDefinition,
  type PageComposerBlockCategory,
  type PageComposerInsertableBlockType,
} from '@/lib/pages/pageComposerBlockRegistry'
import type { Page } from '@/payload-types'

export type PageComposerSectionTemplate =
  | 'service-feature-cards'
  | 'service-interactive'
  | 'service-pricing-steps'

export type PageComposerSectionSummary = {
  badges: string[]
  blockType: Page['layout'][number]['blockType']
  category: PageComposerBlockCategory
  description: string
  index: number
  label: string
  variant: null | string
}

export type PageComposerDocument = Pick<
  Page,
  'hero' | 'id' | 'layout' | 'publishedAt' | 'slug' | 'title' | 'updatedAt' | 'visibility'
> & {
  _status?: null | Page['_status']
  pagePath: string
}

export type PageComposerPageSummary = Pick<
  Page,
  'id' | 'publishedAt' | 'slug' | 'title' | 'updatedAt' | 'visibility'
> & {
  _status?: null | Page['_status']
  pagePath: string
}

export type PageComposerNotice = {
  description: string
  id: string
  title: string
  tone: 'info' | 'warning'
}

type ServiceGridLike = Extract<Page['layout'][number], { blockType: 'serviceGrid' }>

const DEFAULT_SERVICE_GRID_ROWS: ServiceGridLike['services'] = [
  {
    eyebrow: 'Primary lane',
    highlights: [{ text: 'Replace this with the promise or proof that matters most.' }],
    name: 'Section item one',
    pricingHint: 'What affects pricing',
    summary: 'Describe the core job, result, or value of this section item.',
  },
  {
    eyebrow: 'Secondary lane',
    highlights: [{ text: 'Add another short proof point or scope note.' }],
    name: 'Section item two',
    pricingHint: 'Scope note',
    summary: 'Use this row for a second service, step, or supporting detail.',
  },
  {
    eyebrow: 'Third lane',
    highlights: [{ text: 'Keep these defaults short so staff can swap them quickly.' }],
    name: 'Section item three',
    pricingHint: 'Optional detail',
    summary: 'Duplicate, rename, or rewrite these rows to fit the page.',
  },
]

function cloneValue<T>(value: T): T {
  return structuredClone(value)
}

function relationId(value: unknown): null | number {
  if (value && typeof value === 'object' && 'id' in value) {
    const record = value as { id?: null | number | string }
    return typeof record.id === 'number' ? record.id : null
  }

  return typeof value === 'number' ? value : null
}

function buildSummaryBadges(blockType: Page['layout'][number]['blockType']): {
  badges: string[]
  category: PageComposerBlockCategory
} {
  const definition = findPageComposerBlockDefinition(blockType)

  if (!definition) {
    return {
      badges: [],
      category: 'static',
    }
  }

  return {
    badges: [definition.category, ...(definition.supportsReusable ? ['reusable'] : [])],
    category: definition.category,
  }
}

export function frontendPathToPageSlug(pagePath: string): null | string {
  const trimmed = pagePath.trim()

  if (!trimmed) {
    return null
  }

  if (trimmed === '/') {
    return 'home'
  }

  const normalized = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed

  if (!normalized || normalized.includes('/')) {
    return null
  }

  return normalized
}

export function pageSlugToFrontendPath(slug: null | string | undefined): string {
  const trimmed = slug?.trim() || ''

  if (!trimmed || trimmed === 'home') {
    return '/'
  }

  return `/${trimmed}`
}

export function buildPageComposerNotices(args: {
  page: Pick<PageComposerDocument, '_status' | 'slug' | 'visibility'>
  selectedBlock?: null | Page['layout'][number]
}): PageComposerNotice[] {
  const notices: PageComposerNotice[] = [
    {
      description:
        'Quote settings, service-plan settings, and other business globals still live outside the page composer. Edits here only change this page draft unless a block explicitly says it uses a global source.',
      id: 'page-local-scope',
      title: 'Page-local editing',
      tone: 'info',
    },
  ]

  if (args.page.slug === 'home') {
    notices.push({
      description:
        'This page owns the `/` route. Changing its slug moves the public homepage route and can affect primary navigation and SEO expectations.',
      id: 'home-route',
      title: 'Homepage route',
      tone: 'warning',
    })
  }

  if (args.page.visibility === 'private') {
    notices.push({
      description:
        'Private pages stay available to real admins in the frontend composer, but public visitors, static params, and the sitemap will not include them.',
      id: 'private-visibility',
      title: 'Staff-only visibility',
      tone: 'info',
    })
  }

  if (args.selectedBlock?.blockType === 'pricingTable' && args.selectedBlock.dataSource === 'global') {
    notices.push({
      description:
        'This pricing table reads from the shared Pricing global. Update the global if the change should affect other pages that use the same source.',
      id: 'pricing-global-source',
      title: 'Shared pricing source',
      tone: 'warning',
    })
  }

  return notices
}

export function buildPageComposerSectionSummaries(
  layout: null | Page['layout'] | undefined,
): PageComposerSectionSummary[] {
  return (layout || []).map((block, index) => {
    const summaryMeta = buildSummaryBadges(block.blockType)

    if (block.blockType === 'serviceGrid') {
      const variant = block.displayVariant || 'interactive'
      const count = block.services?.length || 0

      return {
        badges: summaryMeta.badges,
        blockType: block.blockType,
        category: summaryMeta.category,
        description: `${variant} - ${count} row${count === 1 ? '' : 's'}`,
        index,
        label: block.heading || `Service section ${index + 1}`,
        variant,
      }
    }

    if (block.blockType === 'mediaBlock') {
      return {
        badges: summaryMeta.badges,
        blockType: block.blockType,
        category: summaryMeta.category,
        description: block.media ? 'Media assigned' : 'No media assigned yet',
        index,
        label: block.blockName?.trim() || `Media block ${index + 1}`,
        variant: null,
      }
    }

    return {
      badges: summaryMeta.badges,
      blockType: block.blockType,
      category: summaryMeta.category,
      description: block.blockName?.trim() || `${block.blockType} section`,
      index,
      label: block.blockName?.trim() || `${block.blockType} block ${index + 1}`,
      variant: null,
    }
  })
}

export function movePageLayoutSection(args: {
  fromIndex: number
  layout: Page['layout']
  toIndex: number
}): Page['layout'] {
  const next = cloneValue(args.layout || [])

  if (
    args.fromIndex < 0 ||
    args.fromIndex >= next.length ||
    args.toIndex < 0 ||
    args.toIndex >= next.length ||
    args.fromIndex === args.toIndex
  ) {
    return next
  }

  const [item] = next.splice(args.fromIndex, 1)

  if (!item) {
    return next
  }

  next.splice(args.toIndex, 0, item)
  return next
}

export function duplicatePageLayoutSection(args: {
  index: number
  layout: Page['layout']
}): Page['layout'] {
  const next = cloneValue(args.layout || [])

  if (args.index < 0 || args.index >= next.length) {
    return next
  }

  const item = next[args.index]

  if (!item) {
    return next
  }

  const duplicate = cloneValue(item)
  if (duplicate.blockName) {
    duplicate.blockName = `${duplicate.blockName} copy`
  }

  next.splice(args.index + 1, 0, duplicate)
  return next
}

export function removePageLayoutSection(args: {
  index: number
  layout: Page['layout']
}): Page['layout'] {
  const next = cloneValue(args.layout || [])

  if (args.index < 0 || args.index >= next.length) {
    return next
  }

  next.splice(args.index, 1)
  return next
}

export function updatePageLayoutSection(args: {
  block: Page['layout'][number]
  index: number
  layout: Page['layout']
}): Page['layout'] {
  const next = cloneValue(args.layout || [])

  if (args.index < 0 || args.index >= next.length) {
    return next
  }

  next[args.index] = cloneValue(args.block)
  return next
}

export function insertPageLayoutBlock(args: {
  block: Page['layout'][number]
  index: number
  layout: Page['layout']
}): Page['layout'] {
  const next = cloneValue(args.layout || [])
  const insertionIndex = Math.max(0, Math.min(args.index, next.length))
  next.splice(insertionIndex, 0, cloneValue(args.block))
  return next
}

export function insertPageLayoutRegisteredBlock(args: {
  index: number
  layout: Page['layout']
  type: PageComposerInsertableBlockType
}): Page['layout'] {
  return insertPageLayoutBlock({
    block: createPageComposerBlock(args.type),
    index: args.index,
    layout: args.layout,
  })
}

export function appendPageLayoutSection(args: {
  layout: Page['layout']
  template: PageComposerSectionTemplate
}): Page['layout'] {
  const next = cloneValue(args.layout || [])
  next.push(createPageComposerSectionTemplate(args.template))
  return next
}

export function createPageComposerSectionTemplate(
  template: PageComposerSectionTemplate,
): Page['layout'][number] {
  if (template === 'service-feature-cards') {
    return {
      blockType: 'serviceGrid',
      displayVariant: 'featureCards',
      eyebrow: 'Featured services',
      heading: 'What we do',
      intro: 'Swap this section onto the page, then rewrite the card copy and media.',
      services: cloneValue(DEFAULT_SERVICE_GRID_ROWS),
    }
  }

  if (template === 'service-pricing-steps') {
    return {
      blockType: 'serviceGrid',
      displayVariant: 'pricingSteps',
      eyebrow: 'Estimate logic',
      heading: 'How our pricing works',
      intro: 'Use these steps to explain how scope, condition, and access change the quote.',
      services: [
        {
          eyebrow: 'Step 1',
          highlights: [{ text: 'Explain the first variable that drives the estimate.' }],
          name: 'First pricing step',
          pricingHint: 'Base scope',
          summary: 'Start with the clearest variable or range customers already understand.',
        },
        {
          eyebrow: 'Step 2',
          highlights: [{ text: 'Note where condition or complexity changes the number.' }],
          name: 'Second pricing step',
          pricingHint: 'Condition',
          summary: 'Use the second step for buildup, risk, or another scope multiplier.',
        },
        {
          eyebrow: 'Step 3',
          highlights: [{ text: 'Close with access, recurrence, or scheduling effects.' }],
          name: 'Third pricing step',
          pricingHint: 'Access and cadence',
          summary: 'Explain what makes the final price go up or down before scheduling.',
        },
      ],
    }
  }

  return {
    blockType: 'serviceGrid',
    displayVariant: 'interactive',
    eyebrow: 'Section label',
    heading: 'Interactive service section',
    intro: 'Use this reusable interactive service section anywhere on the page.',
    services: cloneValue(DEFAULT_SERVICE_GRID_ROWS),
  }
}

export function normalizePageComposerLayoutForSave(layout: Page['layout']): Page['layout'] {
  return cloneValue(layout || []).map((block) => {
    if (block.blockType === 'serviceGrid') {
      return {
        ...block,
        services: (block.services || []).map((service) => ({
          ...service,
          media: relationId(service.media) ?? undefined,
        })),
      }
    }

    if (block.blockType === 'mediaBlock') {
      const media = relationId(block.media)

      return {
        ...block,
        ...(media !== null ? { media } : {}),
      }
    }

    return block
  })
}
