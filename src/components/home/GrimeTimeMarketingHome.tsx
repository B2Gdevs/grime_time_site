import Image from 'next/image'
import Link from 'next/link'
import { ArrowRightIcon, CheckCircle2Icon, DropletsIcon, ShieldCheckIcon, WavesIcon } from 'lucide-react'
import type { RequiredDataFromCollectionSlug } from 'payload'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { InstantQuoteSection } from '@/components/InstantQuoteSection'
import {
  extractLexicalPlainText,
  getHomeServiceGridBlocks,
  getMediaUrl,
} from '@/lib/marketing/public-shell'
import type { InstantQuoteCatalog } from '@/lib/quotes/instantQuoteCatalog'
import { formatCurrency } from '@/lib/quotes/instantQuoteCatalog'
import type { Media, ServiceGridBlock } from '@/payload-types'

function asMedia(value: Media | number | null | undefined): Media | null {
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

export async function GrimeTimeMarketingHome({
  instantQuoteCatalog,
  page,
}: {
  instantQuoteCatalog: InstantQuoteCatalog
  page: RequiredDataFromCollectionSlug<'pages'>
}) {
  const [servicesBlock, pricingBlock] = getHomeServiceGridBlocks(page.layout) as [
    ServiceGridBlock | undefined,
    ServiceGridBlock | undefined,
  ]
  const extraBlocks = page.layout.filter((block) => block.blockType !== 'serviceGrid')
  const heroCopy =
    extractLexicalPlainText(page.hero.richText) ||
    page.meta?.description ||
    'North Texas exterior cleaning with a clearer quote path and visible proof.'
  const heroMedia = asMedia(page.hero.media)
  const heroImageUrl = getMediaUrl(heroMedia)
  const featuredServices = servicesBlock?.services?.slice(0, 3) || []
  const pricingSteps = pricingBlock?.services?.slice(0, 3) || []
  const startingPrice = Math.min(...instantQuoteCatalog.services.map((service) => service.minimum))
  const quarterlySavings = Math.round((1 - instantQuoteCatalog.frequencyMultipliers.quarterly) * 100)

  return (
    <div className="w-full">
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(142,219,62,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.16),transparent_26%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.88fr)] lg:items-center lg:gap-14">
          <div className="max-w-3xl">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-primary/80">
              Grime Time exterior cleaning
            </p>
            <h1 className="mt-4 text-5xl font-semibold leading-[0.92] tracking-[-0.04em] text-foreground md:text-6xl xl:text-[5.4rem]">
              Clear scope.
              <span className="mt-2 block text-primary">Visible results.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              {heroCopy}
            </p>

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

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {renderMetric('Service lanes', `${instantQuoteCatalog.services.length}`)}
              {renderMetric('Starting minimum', formatCurrency(startingPrice))}
              {renderMetric('Quarterly plan savings', `${quarterlySavings}% off`)}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-8 h-32 w-32 rounded-full bg-primary/18 blur-3xl" />
            <div className="absolute bottom-4 right-0 h-28 w-28 rounded-full bg-cyan-400/18 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.3rem] border border-white/10 bg-[#071321] p-4 text-white shadow-[0_32px_100px_-40px_rgba(2,6,23,0.95)]">
              {heroImageUrl ? (
                <div className="relative overflow-hidden rounded-[1.6rem]">
                  <Image
                    src={heroImageUrl}
                    alt={heroMedia?.alt || page.title}
                    width={heroMedia?.width || 1200}
                    height={heroMedia?.height || 1400}
                    className="aspect-[4/4.8] w-full object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071321] via-[#071321]/24 to-transparent" />
                </div>
              ) : (
                <div className="flex aspect-[4/4.8] items-end rounded-[1.6rem] bg-[linear-gradient(180deg,#11314d,#071321)] p-6">
                  <p className="max-w-xs text-sm leading-6 text-white/76">
                    Scope changes when the job gets tighter, dirtier, taller, or harder to access. The point is to show that honestly before the truck rolls.
                  </p>
                </div>
              )}

              <div className="hero-glass-float absolute inset-x-6 bottom-6 rounded-[1.6rem] border border-white/12 bg-black/45 p-5 backdrop-blur-md">
                <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#8EDB3E]">
                  <ShieldCheckIcon className="size-3.5" />
                  Fast lane for homeowners
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Quotes and scheduling without vague contractor talk.
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/78">
                  Strong visuals, clear service lanes, and a quote form that explains what moves the number.
                </p>
              </div>
            </div>

            {featuredServices[2] ? (
              <div className="absolute -left-8 top-12 hidden w-44 rounded-[1.5rem] border border-border/70 bg-card/92 p-4 shadow-[0_22px_70px_-45px_rgba(2,6,23,0.95)] backdrop-blur xl:block">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                  <WavesIcon className="size-4" />
                  Docks and rails
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{featuredServices[2].name}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{featuredServices[2].summary}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {servicesBlock ? (
        <section id="services" className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-primary/80">
              {servicesBlock.eyebrow || 'Featured services'}
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {servicesBlock.heading}
            </h2>
            {servicesBlock.intro ? (
              <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                {servicesBlock.intro}
              </p>
            ) : null}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {featuredServices.map((service) => {
              const media = asMedia(service.media)
              const mediaUrl = getMediaUrl(media)

              return (
                <article key={service.id || service.name} className="overflow-hidden rounded-[1.9rem] border border-border/70 bg-card/82 shadow-[0_18px_80px_-52px_rgba(2,6,23,0.85)]">
                  <div className="relative">
                    {mediaUrl ? (
                      <Image
                        src={mediaUrl}
                        alt={media?.alt || service.name}
                        width={media?.width || 1200}
                        height={media?.height || 900}
                        className="aspect-[16/10] w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-[16/10] w-full bg-[linear-gradient(180deg,rgba(7,19,33,0.88),rgba(17,49,77,0.72))]" />
                    )}
                    <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
                      {service.eyebrow ? (
                        <span className="rounded-full bg-black/55 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                          {service.eyebrow}
                        </span>
                      ) : <span />}
                      {service.pricingHint ? (
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.68rem] font-medium text-white backdrop-blur">
                          {service.pricingHint}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-semibold tracking-tight text-foreground">{service.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{service.summary}</p>

                    {service.highlights?.length ? (
                      <ul className="mt-5 grid gap-3">
                        {service.highlights.map((highlight) => (
                          <li key={highlight.id || highlight.text} className="flex items-start gap-3 text-sm leading-6 text-foreground/86">
                            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                            <span>{highlight.text}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      {pricingBlock ? (
        <section id="pricing" className="border-y border-border/70 bg-card/42">
          <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-primary/80">
                  {pricingBlock.eyebrow || 'Estimate logic'}
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                  {pricingBlock.heading}
                </h2>
                {pricingBlock.intro ? (
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                    {pricingBlock.intro}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {pricingSteps.map((step) => (
                  <div
                    key={step.id || step.name}
                    className="rounded-[1.7rem] border border-border/70 bg-background/88 p-5 shadow-[0_18px_70px_-54px_rgba(2,6,23,0.82)]"
                  >
                    {step.eyebrow ? (
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary/80">
                        {step.eyebrow}
                      </p>
                    ) : null}
                    <h3 className="mt-3 text-xl font-semibold text-foreground">{step.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.summary}</p>
                    {step.highlights?.[0]?.text ? (
                      <p className="mt-4 text-sm font-medium leading-6 text-foreground/80">
                        {step.highlights[0].text}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <InstantQuoteSection catalog={instantQuoteCatalog} />

      {extraBlocks.length > 0 ? <div className="pb-20">{await RenderBlocks({ blocks: extraBlocks })}</div> : null}
    </div>
  )
}
