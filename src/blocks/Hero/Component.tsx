'use client'

import Link from 'next/link'
import { ArrowRightIcon, DropletsIcon, WavesIcon } from 'lucide-react'

import { resolveServiceGridDisplayVariant } from '@/blocks/ServiceGrid/variants'
import { MarketingHeroLead, MarketingHeroPanel } from '@/components/home/MarketingHeroEditable'
import { PageHeroMediaEditable } from '@/components/home/PageHeroRichTextEditable'
import { useResolvedComposerBlockIndex } from '@/components/page-composer/useResolvedComposerBlockIndex'
import { Media } from '@/components/Media'
import { RenderHero } from '@/heros/RenderHero'
import { extractLexicalPlainText } from '@/lib/marketing/public-shell'
import { formatCurrency, type InstantQuoteCatalog } from '@/lib/quotes/instantQuoteCatalog'
import type { FeaturesBlock as FeaturesBlockData, HeroBlock as HeroBlockData, Media as PayloadMediaType, Page, ServiceGridBlock } from '@/payload-types'

type FeatureCardsBlock = FeaturesBlockData

type HeroRenderable = Pick<
  Page['hero'],
  | 'eyebrow'
  | 'headlineAccent'
  | 'headlinePrimary'
  | 'links'
  | 'media'
  | 'panelBody'
  | 'panelEyebrow'
  | 'panelHeading'
  | 'richText'
  | 'type'
>

function asMedia(value: PayloadMediaType | number | null | undefined): PayloadMediaType | null {
  return value && typeof value === 'object' ? value : null
}

function renderMetric(label: string, value: string) {
  return (
    <div className="rounded-[1.6rem] border border-border/70 bg-card/78 px-4 py-4 shadow-[0_18px_60px_-44px_rgba(2,6,23,0.75)] backdrop-blur">
      <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
    </div>
  )
}

function toHeroRenderable(block: HeroBlockData): HeroRenderable {
  return {
    eyebrow: block.eyebrow,
    headlineAccent: block.headlineAccent,
    headlinePrimary: block.headlinePrimary,
    links: block.links,
    media: block.media,
    panelBody: block.panelBody,
    panelEyebrow: block.panelEyebrow,
    panelHeading: block.panelHeading,
    richText: block.richText,
    type: block.type,
  }
}

function resolveDraftHeroBlock(args: {
  block: HeroBlockData
  blockIndex?: number
  toolbarState: ReturnType<typeof useResolvedComposerBlockIndex>['toolbarState']
}): HeroBlockData {
  if (typeof args.blockIndex !== 'number' || !args.toolbarState) {
    return args.block
  }

  const draftBlock = args.toolbarState.draftPage?.layout?.[args.blockIndex]

  return draftBlock?.blockType === 'heroBlock' ? draftBlock : args.block
}

export function HeroBlock({
  blockIndex,
  instantQuoteCatalog,
  layoutBlocks,
  pagePath,
  sectionIdentity,
  ...block
}: HeroBlockData & {
  blockIndex?: number
  instantQuoteCatalog?: InstantQuoteCatalog | null
  layoutBlocks?: Page['layout']
  pagePath?: string
  sectionIdentity?: string
}) {
  const { resolvedBlockIndex, toolbarState } = useResolvedComposerBlockIndex({
    blockIndex,
    sectionIdentity,
  })
  const draftBlock = resolveDraftHeroBlock({
    block,
    blockIndex: resolvedBlockIndex,
    toolbarState,
  })

  if (pagePath === '/' && draftBlock.type === 'lowImpact') {
    const heroCopy =
      extractLexicalPlainText(draftBlock.richText) ||
      'North Texas exterior cleaning with a clearer quote path and visible proof.'
    const heroEyebrow = draftBlock.eyebrow?.trim() || 'Grime Time exterior cleaning'
    const heroHeadlinePrimary = draftBlock.headlinePrimary?.trim() || 'Clear scope.'
    const heroHeadlineAccent = draftBlock.headlineAccent?.trim() || 'Visible results.'
    const heroPanelEyebrow = draftBlock.panelEyebrow?.trim() || 'Fast lane for homeowners'
    const heroPanelHeading = draftBlock.panelHeading?.trim() || 'Quotes and scheduling without vague contractor talk.'
    const heroPanelBody =
      draftBlock.panelBody?.trim() ||
      'Strong visuals, clear service lanes, and a quote form that explains what moves the number.'
    const heroMedia = asMedia(draftBlock.media)
    const featureCardsBlock = (layoutBlocks || []).find(
      (item): item is FeatureCardsBlock => item.blockType === 'features',
    )
    const legacyFeatureCardsBlock = (layoutBlocks || []).find(
      (item): item is ServiceGridBlock =>
        item.blockType === 'serviceGrid' && resolveServiceGridDisplayVariant(item) === 'featureCards',
    )
    const featuredCards =
      featureCardsBlock?.features?.slice(0, 3).map((feature) => ({
        summary: feature.summary,
        title: feature.title,
      })) ||
      legacyFeatureCardsBlock?.services?.slice(0, 3).map((service) => ({
        summary: service.summary,
        title: service.name,
      })) ||
      []
    const serviceLaneCount =
      featureCardsBlock?.features?.length || legacyFeatureCardsBlock?.services?.length || instantQuoteCatalog?.services.length || 0
    const startingPrice = instantQuoteCatalog
      ? Math.min(...instantQuoteCatalog.services.map((service) => service.minimum))
      : 0
    const quarterlySavings = instantQuoteCatalog
      ? Math.round((1 - instantQuoteCatalog.frequencyMultipliers.quarterly) * 100)
      : 0

    return (
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(142,219,62,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.16),transparent_26%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.88fr)] lg:items-center lg:gap-14">
          <div className="max-w-3xl">
            <MarketingHeroLead
              body={heroCopy}
              eyebrow={heroEyebrow}
              headlineAccent={heroHeadlineAccent}
              headlinePrimary={heroHeadlinePrimary}
              panelBody={heroPanelBody}
              panelEyebrow={heroPanelEyebrow}
              panelHeading={heroPanelHeading}
            />

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#instant-quote"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                <DropletsIcon className="size-4" />
                Get instant quote
              </Link>
              <Link
                href="#services"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                See service lanes
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>

            {instantQuoteCatalog ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {renderMetric('Service lanes', `${serviceLaneCount}`)}
                {renderMetric('Starting minimum', formatCurrency(startingPrice))}
                {renderMetric('Quarterly plan savings', `${quarterlySavings}% off`)}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-8 h-32 w-32 rounded-full bg-primary/18 blur-3xl" />
            <div className="absolute bottom-4 right-0 h-28 w-28 rounded-full bg-cyan-400/18 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.3rem] border border-white/10 bg-[#071321] p-4 text-white shadow-[0_32px_100px_-40px_rgba(2,6,23,0.95)]">
              {heroMedia ? (
                <PageHeroMediaEditable relationPath={typeof resolvedBlockIndex === 'number' ? `layout.${resolvedBlockIndex}.media` : undefined}>
                  <div className="relative overflow-hidden rounded-[1.6rem]">
                    <Media
                      imgClassName="aspect-[4/4.8] w-full object-cover"
                      priority
                      resource={heroMedia}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071321] via-[#071321]/24 to-transparent" />
                  </div>
                </PageHeroMediaEditable>
              ) : (
                <div className="flex aspect-[4/4.8] items-end rounded-[1.6rem] bg-[linear-gradient(180deg,#11314d,#071321)] p-6">
                  <p className="max-w-xs text-sm leading-6 text-white/76">
                    Scope changes when the job gets tighter, dirtier, taller, or harder to access. The point is to show that honestly before the truck rolls.
                  </p>
                </div>
              )}

              <MarketingHeroPanel
                panelBody={heroPanelBody}
                panelEyebrow={heroPanelEyebrow}
                panelHeading={heroPanelHeading}
              />
            </div>

            {featuredCards[2] ? (
              <div className="absolute -left-8 top-12 hidden w-44 rounded-[1.5rem] border border-border/70 bg-card/92 p-4 shadow-[0_22px_70px_-45px_rgba(2,6,23,0.95)] backdrop-blur xl:block">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                  <WavesIcon className="size-4" />
                  Docks and rails
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{featuredCards[2].title}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{featuredCards[2].summary}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    )
  }

  return <RenderHero {...(toHeroRenderable(draftBlock) as Page['hero'])} />
}
