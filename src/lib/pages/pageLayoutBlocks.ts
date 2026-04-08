import type { HeroBlock, Page, ServiceEstimatorBlock } from '@/payload-types'

function cloneValue<T>(value: T): T {
  return structuredClone(value)
}

function createBaseHeroBlock(): HeroBlock {
  return {
    blockType: 'heroBlock',
    type: 'lowImpact',
  }
}

export function createDefaultHeroBlock(): HeroBlock {
  return {
    ...createBaseHeroBlock(),
    eyebrow: 'Grime Time exterior cleaning',
    headlineAccent: 'Visible results.',
    headlinePrimary: 'Clear scope.',
    panelBody: 'Strong visuals, clear service lanes, and a quote form that explains what moves the number.',
    panelEyebrow: 'Fast lane for homeowners',
    panelHeading: 'Quotes and scheduling without vague contractor talk.',
  }
}

export function createServiceEstimatorBlock(): ServiceEstimatorBlock {
  return {
    blockType: 'serviceEstimator',
  }
}

export function createLegacyHeroBlockFromPageHero(hero: Page['hero'] | null | undefined): HeroBlock | null {
  if (!hero?.type || hero.type === 'none') {
    return null
  }

  return {
    ...createBaseHeroBlock(),
    ...(hero.eyebrow ? { eyebrow: hero.eyebrow } : {}),
    ...(hero.headlineAccent ? { headlineAccent: hero.headlineAccent } : {}),
    ...(hero.headlinePrimary ? { headlinePrimary: hero.headlinePrimary } : {}),
    ...(hero.links ? { links: cloneValue(hero.links) } : {}),
    ...(hero.media ? { media: hero.media } : {}),
    ...(hero.panelBody ? { panelBody: hero.panelBody } : {}),
    ...(hero.panelEyebrow ? { panelEyebrow: hero.panelEyebrow } : {}),
    ...(hero.panelHeading ? { panelHeading: hero.panelHeading } : {}),
    ...(hero.richText ? { richText: cloneValue(hero.richText) } : {}),
    type: hero.type,
  }
}

export function createLegacyHeroGroupFromBlock(args: {
  block: HeroBlock | null | undefined
  fallback?: null | Page['hero']
}): Page['hero'] {
  const block = args.block

  if (!block) {
    return args.fallback && args.fallback.type && args.fallback.type !== 'none'
      ? cloneValue(args.fallback)
      : {
          type: 'none',
        }
  }

  return {
    ...(block.eyebrow ? { eyebrow: block.eyebrow } : {}),
    ...(block.headlineAccent ? { headlineAccent: block.headlineAccent } : {}),
    ...(block.headlinePrimary ? { headlinePrimary: block.headlinePrimary } : {}),
    ...(block.links ? { links: cloneValue(block.links) } : {}),
    ...(block.media ? { media: block.media } : {}),
    ...(block.panelBody ? { panelBody: block.panelBody } : {}),
    ...(block.panelEyebrow ? { panelEyebrow: block.panelEyebrow } : {}),
    ...(block.panelHeading ? { panelHeading: block.panelHeading } : {}),
    ...(block.richText ? { richText: cloneValue(block.richText) } : {}),
    type: block.type || 'lowImpact',
  }
}

export function normalizePageLayoutBlocks(args: {
  page: Pick<Page, 'hero' | 'layout'>
  pagePath: string
}): Page['layout'] {
  const layout = cloneValue(args.page.layout || [])
  const hasHeroBlock = layout.some((block) => block.blockType === 'heroBlock')
  const hasServiceEstimator = layout.some((block) => block.blockType === 'serviceEstimator')
  const legacyHeroBlock = createLegacyHeroBlockFromPageHero(args.page.hero)
  const shouldUpgradeLegacyHome =
    args.pagePath === '/' && !hasHeroBlock && !hasServiceEstimator && Boolean(legacyHeroBlock)

  if (!hasHeroBlock && legacyHeroBlock) {
    layout.unshift(legacyHeroBlock)
  }

  if (shouldUpgradeLegacyHome) {
    layout.push(createServiceEstimatorBlock())
  }

  return layout
}

export function findHeroBlock(layout: null | Page['layout'] | undefined): HeroBlock | null {
  const block = (layout || []).find((item) => item.blockType === 'heroBlock')
  return block?.blockType === 'heroBlock' ? block : null
}

export function buildPageDocumentBlocksForSave(args: {
  fallbackHero?: null | Page['hero']
  layout: Page['layout']
}): Pick<Page, 'hero' | 'layout'> {
  const layout = cloneValue(args.layout || [])
  const heroBlock = findHeroBlock(layout)

  return {
    hero: createLegacyHeroGroupFromBlock({
      block: heroBlock,
      fallback: args.fallbackHero,
    }),
    layout,
  }
}
