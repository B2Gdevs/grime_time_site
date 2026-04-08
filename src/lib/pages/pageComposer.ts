import {
  createPageComposerBlock,
  findPageComposerBlockDefinition,
  type PageComposerBlockCategory,
  type PageComposerInsertableBlockType,
} from '@/lib/pages/pageComposerBlockRegistry'
import { createDefaultHeroBlock, createServiceEstimatorBlock } from '@/lib/pages/pageLayoutBlocks'
import { lexicalToPlainText } from '@/lib/pages/pageComposerLexical'
import {
  linkedSharedSectionId,
  resolvePageComposerReusableBlock,
  type ReusableAwareLayoutBlock,
} from '@/lib/pages/pageComposerReusableBlocks'
import type { SharedSectionRecord } from '@/lib/pages/sharedSections'
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
  hidden: boolean
  index: number
  label: string
  variant: null | string
}

export type PageComposerDocument = Pick<
  Page,
  'hero' | 'layout' | 'publishedAt' | 'slug' | 'title' | 'visibility'
> & {
  _status?: null | Page['_status']
  id: null | Page['id']
  pagePath: string
  updatedAt: null | Page['updatedAt']
}

export type PageComposerPageSummary = Pick<
  Page,
  'id' | 'publishedAt' | 'slug' | 'title' | 'updatedAt' | 'visibility'
> & {
  _status?: null | Page['_status']
  pagePath: string
}

export type PageComposerVersionSummary = {
  createdAt: string
  id: string
  latest: boolean
  pagePath: string
  slug: string
  status: 'draft' | 'published'
  title: string
  updatedAt: string
}

export type PageComposerNotice = {
  description: string
  id: string
  title: string
  tone: 'info' | 'warning'
}

export type PageComposerValidationIssue = {
  blockIndex: null | number
  id: string
  message: string
  tone: 'info' | 'warning'
}

export type PageComposerValidationSummary = {
  issues: PageComposerValidationIssue[]
  pageStatus: 'draft' | 'published'
}

type SharedSectionMap = Map<number, Pick<SharedSectionRecord, 'currentVersion' | 'id' | 'name' | 'structure'>>

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

export function formatPageComposerTitleFromSlug(slug: string): string {
  const trimmed = slug.trim()

  if (!trimmed) {
    return ''
  }

  return trimmed
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export function pageSlugToFrontendPath(slug: null | string | undefined): string {
  const trimmed = slug?.trim() || ''

  if (!trimmed || trimmed === 'home') {
    return '/'
  }

  return `/${trimmed}`
}

/** Marketing `[slug]` routes only — excludes multi-segment paths and non-composer surfaces. */
export function isMarketingComposerPagePath(pagePath: string): boolean {
  return frontendPathToPageSlug(pagePath) !== null
}

export function filterMarketingComposerPageSummaries(
  pages: PageComposerPageSummary[],
): PageComposerPageSummary[] {
  return pages.filter((p) => isMarketingComposerPagePath(p.pagePath))
}

/**
 * Collapsed composer “Pages” list: published marketing routes only, plus the page document
 * for the route currently open in the preview (even when it is draft-only). Draft-only
 * experiments on other slugs stay hidden until the user turns on “Show all”.
 */
export function filterUniqueMarketingRouteSummariesForComposer(
  pages: PageComposerPageSummary[],
  currentPath: string,
): PageComposerPageSummary[] {
  const current = normalizeComposerRoutePath(currentPath)
  return pages.filter((p) => {
    if (p._status === 'published') {
      return true
    }
    return normalizeComposerRoutePath(p.pagePath) === current
  })
}

/** Normalize path for comparing current route to `pagePath` (trailing slash, home). */
export function normalizeComposerRoutePath(path: string): string {
  const t = path.trim() || '/'
  if (t === '/') return '/'
  return t.endsWith('/') ? t.slice(0, -1) : t
}

export function createPageComposerDocumentSeed(args: { pagePath: string }): PageComposerDocument {
  const normalizedPagePath = args.pagePath.trim() || '/'
  const slug = frontendPathToPageSlug(normalizedPagePath) || ''

  return {
    _status: 'draft',
    hero: {
      type: 'none',
    },
    id: null,
    layout:
      normalizedPagePath === '/'
        ? [createDefaultHeroBlock(), createServiceEstimatorBlock()]
        : [createDefaultHeroBlock()],
    pagePath: normalizedPagePath,
    publishedAt: null,
    slug,
    title: formatPageComposerTitleFromSlug(slug),
    updatedAt: null,
    visibility: 'public',
  }
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

  if (args.selectedBlock?.isHidden) {
    notices.push({
      description:
        'This block stays in the draft and structure list, but the rendered page omits it until you show it again.',
      id: 'selected-block-hidden',
      title: 'Hidden block',
      tone: 'info',
    })
  }

  return notices
}

export function buildPageComposerSectionSummaries(
  layout: null | Page['layout'] | undefined,
  sharedSectionsById?: SharedSectionMap,
): PageComposerSectionSummary[] {
  return (layout || []).map((rawBlock, index) => {
    const block = resolvePageComposerReusableBlock(rawBlock, { sharedSectionsById })
    const summaryMeta = buildSummaryBadges(block.blockType)
    const hidden = Boolean(block.isHidden)
    const reusableMeta = (rawBlock as ReusableAwareLayoutBlock).composerReusable
    const reusableMode = reusableMeta?.mode
    const sharedSectionId = linkedSharedSectionId(rawBlock)
    const badges = [
      ...summaryMeta.badges,
      ...(reusableMode === 'linked' ? ['linked'] : reusableMode === 'detached' ? ['detached'] : []),
      ...(sharedSectionId ? ['shared'] : []),
      ...(hidden ? ['hidden'] : []),
    ]

    if (block.blockType === 'serviceGrid') {
      const variant = block.displayVariant || 'interactive'
      const count = block.services?.length || 0

      return {
        badges,
        blockType: block.blockType,
        category: summaryMeta.category,
        description: `${variant} - ${count} row${count === 1 ? '' : 's'}`,
        hidden,
        index,
        label: reusableMeta?.label || block.heading || `Service section ${index + 1}`,
        variant,
      }
    }

    if (block.blockType === 'mediaBlock') {
      return {
        badges,
        blockType: block.blockType,
        category: summaryMeta.category,
        description: block.media ? 'Media assigned' : 'No media assigned yet',
        hidden,
        index,
        label: block.blockName?.trim() || `Media block ${index + 1}`,
        variant: null,
      }
    }

    if (block.blockType === 'heroBlock') {
      return {
        badges,
        blockType: block.blockType,
        category: summaryMeta.category,
        description:
          block.type === 'none'
            ? 'Hero disabled'
            : block.media
              ? `${block.type} hero with media`
              : `${block.type} hero`,
        hidden,
        index,
        label: 'Hero',
        variant: block.type || null,
      }
    }

    if (block.blockType === 'serviceEstimator') {
      return {
        badges,
        blockType: block.blockType,
        category: summaryMeta.category,
        description: 'Code-owned quote and estimator experience',
        hidden,
        index,
        label: 'Service estimator',
        variant: null,
      }
    }

    return {
      badges,
      blockType: block.blockType,
      category: summaryMeta.category,
      description:
        block.blockType === 'content'
          ? `${block.columns?.length || 0} slot${block.columns?.length === 1 ? '' : 's'}`
          : block.blockType === 'cta'
            ? lexicalToPlainText(block.richText || null) || `${block.links?.length || 0} CTA links`
            : block.blockType === 'pricingTable'
              ? block.dataSource === 'global'
                ? 'Global pricing source'
                : `${block.inlinePlans?.length || 0} inline plan${block.inlinePlans?.length === 1 ? '' : 's'}`
              : block.blockType === 'customHtml'
                ? block.label?.trim() || 'Trusted custom HTML'
                : block.blockName?.trim() || `${block.blockType} section`,
      hidden,
      index,
      label:
        reusableMeta?.label ||
        (block.blockType === 'pricingTable'
          ? block.heading || `Pricing block ${index + 1}`
          : block.blockType === 'customHtml'
            ? block.label?.trim() || `Custom HTML ${index + 1}`
            : block.blockName?.trim() || `${block.blockType} block ${index + 1}`),
      variant: null,
    }
  })
}

export function countPageComposerChangedBlocks(args: {
  baselineLayout: null | Page['layout'] | undefined
  draftLayout: null | Page['layout'] | undefined
}): number {
  const baseline = normalizePageComposerLayoutForSave(args.baselineLayout || [])
  const draft = normalizePageComposerLayoutForSave(args.draftLayout || [])
  const length = Math.max(baseline.length, draft.length)
  let changed = 0

  for (let index = 0; index < length; index += 1) {
    if (JSON.stringify(baseline[index] || null) !== JSON.stringify(draft[index] || null)) {
      changed += 1
    }
  }

  return changed
}

export function buildPageComposerValidationSummary(args: {
  page: Pick<PageComposerDocument, '_status' | 'layout' | 'slug' | 'title' | 'visibility'>
  sharedSectionsById?: SharedSectionMap
}): PageComposerValidationSummary {
  const issues: PageComposerValidationIssue[] = []

  if (!args.page.title?.trim()) {
    issues.push({
      blockIndex: null,
      id: 'missing-title',
      message: 'Page title is required before publish.',
      tone: 'warning',
    })
  }

  if (!args.page.slug?.trim()) {
    issues.push({
      blockIndex: null,
      id: 'missing-slug',
      message: 'Slug is required before publish.',
      tone: 'warning',
    })
  }

  if (!(args.page.layout || []).length) {
    issues.push({
      blockIndex: null,
      id: 'empty-layout',
      message: 'The page does not contain any blocks yet.',
      tone: 'warning',
    })
  }

  ;(args.page.layout || []).forEach((rawBlock, index) => {
    const sharedSectionId = linkedSharedSectionId(rawBlock)

    if (
      sharedSectionId &&
      args.sharedSectionsById &&
      !args.sharedSectionsById.has(sharedSectionId)
    ) {
      issues.push({
        blockIndex: index,
        id: `shared-section-missing-${index}`,
        message: `Linked shared section ${sharedSectionId} is not available for block ${index + 1}.`,
        tone: 'warning',
      })
    }

    const block = resolvePageComposerReusableBlock(rawBlock, {
      sharedSectionsById: args.sharedSectionsById,
    })

    if (block.blockType === 'serviceGrid') {
      if (!block.heading?.trim()) {
        issues.push({
          blockIndex: index,
          id: `service-grid-heading-${index}`,
          message: `Block ${index + 1} needs a heading.`,
          tone: 'warning',
        })
      }

      if (!(block.services || []).length) {
        issues.push({
          blockIndex: index,
          id: `service-grid-rows-${index}`,
          message: `Block ${index + 1} needs at least one service row.`,
          tone: 'warning',
        })
      }
    }

    if (block.blockType === 'content' && !(block.columns || []).length) {
      issues.push({
        blockIndex: index,
        id: `content-slots-${index}`,
        message: `Content block ${index + 1} needs at least one slot.`,
        tone: 'warning',
      })
    }

    if (block.blockType === 'pricingTable' && block.dataSource === 'inline' && !(block.inlinePlans || []).length) {
      issues.push({
        blockIndex: index,
        id: `pricing-inline-${index}`,
        message: `Pricing block ${index + 1} is set to inline plans but does not have any plans yet.`,
        tone: 'warning',
      })
    }

    if (block.blockType === 'heroBlock' && block.type !== 'none' && !block.richText && !block.headlinePrimary?.trim()) {
      issues.push({
        blockIndex: index,
        id: `hero-content-${index}`,
        message: `Hero block ${index + 1} needs headline or body copy.`,
        tone: 'warning',
      })
    }

    if (block.blockType === 'customHtml') {
      const sanitizedHtml = block.html?.trim() ? block.html.trim() : ''

      if (!sanitizedHtml) {
        issues.push({
          blockIndex: index,
          id: `custom-html-empty-${index}`,
          message: `Custom HTML block ${index + 1} is empty.`,
          tone: 'warning',
        })
      }
    }
  })

  return {
    issues,
    pageStatus: args.page._status === 'published' ? 'published' : 'draft',
  }
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

export function togglePageLayoutSectionHidden(args: {
  index: number
  layout: Page['layout']
}): Page['layout'] {
  const next = cloneValue(args.layout || [])

  if (args.index < 0 || args.index >= next.length) {
    return next
  }

  const block = next[args.index]

  if (!block) {
    return next
  }

  next[args.index] = {
    ...block,
    isHidden: !Boolean(block.isHidden),
  }

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
    if (block.blockType === 'heroBlock') {
      const media = relationId(block.media)

      return {
        ...block,
        ...(media !== null ? { media } : {}),
      }
    }

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
