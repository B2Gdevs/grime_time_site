'use client'

import Link from 'next/link'
import { useState, type ComponentType } from 'react'

import {
  ArrowRightIcon,
  Building2Icon,
  Grid2x2Icon,
  HouseIcon,
  PanelsTopLeftIcon,
  WavesIcon,
} from 'lucide-react'

import { BubbleBackground } from '@/components/BubbleBackground'
import { Button } from '@/components/ui/button'

type ServiceTab = {
  bestFor: string
  ctaLabel: string
  ctaUrl: string
  icon: ComponentType<{ className?: string }>
  notes: string[]
  pricing: string
  title: string
  value: string
}

const serviceTabs: ServiceTab[] = [
  {
    bestFor: 'Siding, trim, soffits, curb appeal resets, maintenance plans',
    ctaLabel: 'Start house wash quote',
    ctaUrl: '/#instant-quote',
    icon: HouseIcon,
    notes: [
      'Soft-wash first for surfaces that should be cleaned, not blasted.',
      'Price starts with home size, then adjusts for stories, access, and buildup.',
      'Best service line for recurring residential relationships.',
    ],
    pricing: 'Square footage + stories + buildup + setup',
    title: 'House washing',
    value: 'house',
  },
  {
    bestFor: 'Driveways, walkways, patios, high-visibility concrete',
    ctaLabel: 'Start concrete quote',
    ctaUrl: '/#instant-quote',
    icon: Grid2x2Icon,
    notes: [
      'Flatwork pricing should reflect stain severity and cleanup edges, not just total size.',
      'Concrete sells well because the visual change is immediate.',
      'Strong upsell lane on the same visit as a house wash.',
    ],
    pricing: 'Square footage + stain severity + edge/detail work',
    title: 'Driveway / concrete',
    value: 'concrete',
  },
  {
    bestFor: 'Front porches, steps, patios, mixed-surface outdoor spaces',
    ctaLabel: 'Start porch quote',
    ctaUrl: '/#instant-quote',
    icon: PanelsTopLeftIcon,
    notes: [
      'Small areas still need pricing discipline because details eat time fast.',
      'Furniture movement, railings, and surface changes should affect the scope.',
      'Useful add-on when the main job needs higher ticket value.',
    ],
    pricing: 'Minimum charge + complexity + obstructions',
    title: 'Deck / porch',
    value: 'porch',
  },
  {
    bestFor: 'Docks, slips, waterfront walkways, algae-heavy surfaces',
    ctaLabel: 'Start dock quote',
    ctaUrl: '/#instant-quote',
    icon: WavesIcon,
    notes: [
      'Water-side jobs need clearer safety and access review than a normal driveway job.',
      'Rails, stairs, algae, and slip risk all change the economics.',
      'These jobs justify stronger pricing when the scope is handled correctly.',
    ],
    pricing: 'Square footage + access + safety + algae severity',
    title: 'Dock / water',
    value: 'dock',
  },
  {
    bestFor: 'Dumpster pads, service lanes, storefronts, recurring flatwork',
    ctaLabel: 'Talk commercial scope',
    ctaUrl: '/contact',
    icon: Building2Icon,
    notes: [
      'Commercial is the growth lane, but it should still route to a real scope review.',
      'Recurrence, chemistry, liability, and route density matter more than a generic rate card.',
      'Position this as available by review, not fake instant pricing.',
    ],
    pricing: 'Custom scope + recurrence + liability + travel density',
    title: 'Commercial',
    value: 'commercial',
  },
]

export function HomeServiceSurface() {
  const [activeService, setActiveService] = useState(serviceTabs[0]?.value ?? 'house')
  const activeTab = serviceTabs.find((tab) => tab.value === activeService) ?? serviceTabs[0]

  if (!activeTab) return null

  const ActiveIcon = activeTab.icon

  return (
    <section className="site-section-shell relative overflow-hidden px-6 py-8 md:px-10 md:py-10">
      <BubbleBackground className="bg-white dark:bg-card" density={24} speed={0.9} />

      <div className="relative z-10 grid gap-8">
        <div className="max-w-4xl">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
            What we do
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Residential exterior cleaning first, with a path into repeat commercial work.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
            We quote from square footage and job conditions, then confirm the real scope before
            scheduling. Keep the screen tight: pick a service on the left and read only the details
            that matter for that lane.
          </p>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-background/85 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2 border-b border-border/80 px-4 py-3">
            <span className="size-2.5 rounded-full bg-black/80 dark:bg-white/70" />
            <span className="size-2.5 rounded-full bg-black/45 dark:bg-white/40" />
            <span className="size-2.5 rounded-full bg-black/20 dark:bg-white/20" />
            <span className="ml-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              services.tsx
            </span>
          </div>

          <div className="grid gap-0 md:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="border-b border-border/80 bg-muted/35 p-3 md:border-b-0 md:border-r">
              <div className="grid h-auto gap-1 bg-transparent p-0" role="tablist" aria-label="Services">
                {serviceTabs.map(({ ctaLabel, icon: Icon, pricing, title, value }) => {
                  const isActive = value === activeService

                  return (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`service-panel-${value}`}
                      id={`service-tab-${value}`}
                      onClick={() => setActiveService(value)}
                      className={[
                        'justify-start rounded-xl border border-transparent px-3 py-3 text-left transition',
                        isActive ? 'bg-background shadow-sm' : 'hover:bg-background/70',
                      ].join(' ')}
                    >
                      <div className="flex w-full items-start gap-3">
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/85 text-primary">
                          <Icon className="size-4" />
                        </span>
                        <span className="grid gap-1">
                          <span className="text-sm font-medium leading-tight">{title}</span>
                          <span className="text-xs leading-5 text-muted-foreground">{pricing}</span>
                          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
                            {ctaLabel}
                          </span>
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-4 md:p-6">
              <div
                id={`service-panel-${activeTab.value}`}
                role="tabpanel"
                aria-labelledby={`service-tab-${activeTab.value}`}
                className="rounded-[1.5rem] border border-border/80 bg-card/65 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                      Active service
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                      {activeTab.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {activeTab.bestFor}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <ActiveIcon className="size-5" />
                    </span>
                    <Button asChild>
                      <Link href={activeTab.ctaUrl}>
                        {activeTab.ctaLabel}
                        <ArrowRightIcon className="size-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/schedule">Book consult</Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_17rem]">
                  <div className="grid gap-3">
                    {activeTab.notes.map((note, index) => (
                      <div
                        key={note}
                        className="rounded-2xl border border-border/75 bg-background/80 px-4 py-3"
                      >
                        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary/80">
                          {index === 0 ? 'Approach' : index === 1 ? 'Pricing' : 'Why it matters'}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid content-start gap-3">
                    <div className="rounded-2xl border border-border/75 bg-background/80 px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary/80">
                        Best for
                      </p>
                      <p className="mt-2 text-sm leading-7 text-foreground/90">{activeTab.bestFor}</p>
                    </div>
                    <div className="rounded-2xl border border-border/75 bg-background/80 px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary/80">
                        Priced by
                      </p>
                      <p className="mt-2 text-sm leading-7 text-foreground/90">{activeTab.pricing}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
