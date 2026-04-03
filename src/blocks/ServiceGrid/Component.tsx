'use client'

import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  DockIcon,
  DropletsIcon,
  HomeIcon,
  MountainIcon,
  RulerIcon,
  WavesIcon,
} from 'lucide-react'

import { InlinePageMediaEditor } from '@/components/admin-impersonation/InlinePageMediaEditor'
import { BubbleBackground } from '@/components/BubbleBackground'
import { Media } from '@/components/Media'
import { Button } from '@/components/ui/button'
import type { ServiceGridBlock as ServiceGridBlockData } from '@/payload-types'

import { resolveServiceGridDisplayVariant } from './variants'

type ServiceGridRow = NonNullable<ServiceGridBlockData['services']>[number]

type ServiceGridBlockProps = ServiceGridBlockData & {
  blockIndex?: number
}

function hasMedia(
  media: ServiceGridRow['media'],
): media is Exclude<ServiceGridRow['media'], null | number | string> {
  return Boolean(media && typeof media === 'object')
}

function getRowIconKey(name: string) {
  const key = name.toLowerCase()
  if (key.includes('square footage')) return 'ruler'
  if (key.includes('condition')) return 'waves'
  if (key.includes('access') || key.includes('recurrence')) return 'dollar'
  if (key.includes('house')) return 'home'
  if (key.includes('driveway') || key.includes('flatwork')) return 'mountain'
  if (key.includes('dock') || key.includes('waterfront')) return 'dock'
  return 'droplets'
}

function ServiceGridRowIcon({ className, name }: { className?: string; name: string }) {
  const iconKey = getRowIconKey(name)

  if (iconKey === 'ruler') {
    return <RulerIcon className={className} />
  }

  if (iconKey === 'waves') {
    return <WavesIcon className={className} />
  }

  if (iconKey === 'dollar') {
    return <CircleDollarSignIcon className={className} />
  }

  if (iconKey === 'home') {
    return <HomeIcon className={className} />
  }

  if (iconKey === 'mountain') {
    return <MountainIcon className={className} />
  }

  if (iconKey === 'dock') {
    return <DockIcon className={className} />
  }

  return <DropletsIcon className={className} />
}

export const ServiceGridBlock: React.FC<ServiceGridBlockProps> = ({
  blockIndex,
  displayVariant,
  eyebrow,
  heading,
  intro,
  services,
}) => {
  const variant = resolveServiceGridDisplayVariant({ displayVariant, heading })

  if (variant === 'featureCards') {
    return (
      <FeatureCardsServiceGrid
        blockIndex={blockIndex}
        eyebrow={eyebrow}
        heading={heading}
        intro={intro}
        services={services}
      />
    )
  }

  if (variant === 'pricingSteps') {
    return <PricingStepsServiceGrid eyebrow={eyebrow} heading={heading} intro={intro} services={services} />
  }

  return <InteractiveServiceGrid eyebrow={eyebrow} heading={heading} intro={intro} services={services} />
}

const InteractiveServiceGrid: React.FC<
  Pick<ServiceGridBlockData, 'eyebrow' | 'heading' | 'intro' | 'services'>
> = ({
  eyebrow,
  heading,
  intro,
  services,
}) => {
  const sectionId = heading?.trim().toLowerCase() === 'what we do' ? 'services' : undefined
  const headingKey = heading?.trim().toLowerCase() || ''
  const isPricing = headingKey === 'how our pricing works'
  const isWhatWeDo = headingKey === 'what we do'
  const rows = services || []
  const [activeIndex, setActiveIndex] = React.useState(0)
  const activeRow = rows[activeIndex] || rows[0]

  React.useEffect(() => {
    setActiveIndex(0)
  }, [heading, rows.length])

  if (!activeRow) return null

  return (
    <section className="container scroll-mt-24" id={sectionId}>
      <div className="site-section-shell overflow-hidden px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
        {isWhatWeDo ? <BubbleBackground className="opacity-15 mix-blend-multiply" density={24} speed={0.75} /> : null}
        <div className="mb-7 max-w-3xl sm:mb-10">
          {eyebrow ? (
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-primary sm:mb-3 sm:text-sm">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">{heading}</h2>
          {intro ? <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{intro}</p> : null}
        </div>

        <div
          className={`grid gap-6 ${isPricing ? 'lg:grid-cols-[minmax(0,1fr)_18rem]' : 'lg:grid-cols-[18rem_minmax(0,1fr)]'}`}
        >
          <div className={`rounded-[1.4rem] border border-border/80 bg-background/80 p-3 ${isPricing ? 'lg:order-2' : ''}`}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {isPricing ? 'Select pricing step' : 'Select exterior lane'}
            </p>
            <ul className="flex snap-x gap-2 overflow-x-auto px-1 pb-1 lg:grid lg:gap-2 lg:overflow-visible lg:px-0 lg:pb-0">
              {rows.map((row, index) => {
                const active = index === activeIndex
                return (
                  <li key={`${row.name}-${index}`} className="min-w-[12.5rem] snap-start lg:min-w-0">
                    <button
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                        active
                          ? 'border-primary/50 bg-primary/12 text-foreground'
                          : 'border-border/70 bg-background/50 text-muted-foreground hover:border-border hover:text-foreground'
                      }`}
                      onClick={() => setActiveIndex(index)}
                      type="button"
                    >
                      <div className="flex items-center gap-2">
                        <ServiceGridRowIcon className="size-3.5 shrink-0 text-primary/90" name={row.name} />
                        {row.eyebrow ? (
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/90">
                            {row.eyebrow}
                          </p>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-medium leading-snug">{row.name}</p>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className={`overflow-hidden rounded-[1.75rem] border border-border/80 bg-background/88 shadow-sm ${isPricing ? 'lg:order-1' : ''}`}>
            {(() => {
              const rowMedia = hasMedia(activeRow.media) ? activeRow.media : null
              const highlights = activeRow.highlights?.filter((item) => item?.text?.trim()) ?? []
              const hasFooter = Boolean(activeRow.pricingHint)

              return (
                <>
                  <div className="relative aspect-[4/3] overflow-hidden border-b border-border/80 bg-muted sm:aspect-[18/8]">
                    {rowMedia ? (
                      <>
                        <Media fill imgClassName="object-cover" priority resource={rowMedia} />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,13,25,0.08)_0%,rgba(7,13,25,0.74)_100%)]" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(86,175,255,0.22),transparent_50%),linear-gradient(180deg,rgba(242,247,255,0.9)_0%,rgba(232,240,249,0.6)_100%)]" />
                    )}

                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="flex items-center gap-2">
                        <ServiceGridRowIcon className="size-4 shrink-0 text-white/80" name={activeRow.name} />
                        {activeRow.eyebrow ? (
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                            {activeRow.eyebrow}
                          </p>
                        ) : null}
                      </div>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-balance sm:text-2xl">
                        {activeRow.name}
                      </h3>
                    </div>
                  </div>

                  <div className="grid gap-4 p-4 sm:gap-5 sm:p-5">
                    <p className="text-sm leading-6 text-muted-foreground sm:leading-7">{activeRow.summary}</p>

                    {highlights.length > 0 ? (
                      <ul className="grid gap-3">
                        {highlights.map((item, highlightIndex) => (
                          <li key={`${activeRow.name}-highlight-${highlightIndex}`} className="flex gap-3 text-sm">
                            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                            <span className="leading-6 text-foreground/90">{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {hasFooter ? (
                      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border/80 bg-muted/35 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
                            Priced around
                          </p>
                          <p className="mt-1 text-sm text-foreground/90">{activeRow.pricingHint}</p>
                        </div>
                        <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                          <Link href="/#instant-quote">
                            Estimate
                            <ArrowRightIcon className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </section>
  )
}

const FeatureCardsServiceGrid: React.FC<
  Pick<ServiceGridBlockProps, 'blockIndex' | 'eyebrow' | 'heading' | 'intro' | 'services'>
> = ({
  blockIndex,
  eyebrow,
  heading,
  intro,
  services,
}) => {
  const rows = services || []

  if (!rows.length) {
    return null
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20" id="services">
      <div className="max-w-3xl">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-primary/80">
          {eyebrow || 'Featured services'}
        </p>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{heading}</h2>
        {intro ? <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{intro}</p> : null}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {rows.map((service, serviceIndex) => {
          const media = hasMedia(service.media) ? service.media : null
          const mediaUrl = media?.sizes?.large?.url || media?.sizes?.medium?.url || media?.url || null
          const relationPath =
            typeof blockIndex === 'number' ? `layout.${blockIndex}.services.${serviceIndex}.media` : null

          return (
            <article
              key={service.id || service.name}
              className="overflow-hidden rounded-[1.9rem] border border-border/70 bg-card/82 shadow-[0_18px_80px_-52px_rgba(2,6,23,0.85)]"
            >
              <div className="relative">
                {media && mediaUrl && relationPath ? (
                  <InlinePageMediaEditor relationPath={relationPath}>
                    <Image
                      src={mediaUrl}
                      alt={media.alt || service.name}
                      width={media.width || 1200}
                      height={media.height || 900}
                      className="aspect-[16/10] w-full object-cover"
                    />
                  </InlinePageMediaEditor>
                ) : media && mediaUrl ? (
                  <Image
                    src={mediaUrl}
                    alt={media.alt || service.name}
                    width={media.width || 1200}
                    height={media.height || 900}
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
                  ) : (
                    <span />
                  )}
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
                      <li
                        key={highlight.id || highlight.text}
                        className="flex items-start gap-3 text-sm leading-6 text-foreground/86"
                      >
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
  )
}

const PricingStepsServiceGrid: React.FC<
  Pick<ServiceGridBlockData, 'eyebrow' | 'heading' | 'intro' | 'services'>
> = ({
  eyebrow,
  heading,
  intro,
  services,
}) => {
  const rows = services?.slice(0, 3) || []

  if (!rows.length) {
    return null
  }

  return (
    <section className="border-y border-border/70 bg-card/42" id="pricing">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-primary/80">
              {eyebrow || 'Estimate logic'}
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{heading}</h2>
            {intro ? <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{intro}</p> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {rows.map((step) => (
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
                  <p className="mt-4 text-sm font-medium leading-6 text-foreground/80">{step.highlights[0].text}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
