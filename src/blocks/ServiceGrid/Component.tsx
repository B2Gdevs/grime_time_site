import Link from 'next/link'
import React from 'react'

import { ArrowRightIcon, CheckCircle2Icon } from 'lucide-react'

import { Media } from '@/components/Media'
import { Button } from '@/components/ui/button'
import type { ServiceGridBlock as ServiceGridBlockData } from '@/payload-types'

type ServiceGridRow = NonNullable<ServiceGridBlockData['services']>[number]

function hasMedia(
  media: ServiceGridRow['media'],
): media is Exclude<ServiceGridRow['media'], null | number | string> {
  return Boolean(media && typeof media === 'object')
}

export const ServiceGridBlock: React.FC<ServiceGridBlockData> = ({
  eyebrow,
  heading,
  intro,
  services,
}) => {
  const sectionId = heading?.trim().toLowerCase() === 'what we do' ? 'services' : undefined

  return (
    <section className="container scroll-mt-24" id={sectionId}>
      <div className="site-section-shell overflow-hidden px-6 py-8 md:px-10 md:py-10">
        <div className="mb-10 max-w-3xl">
          {eyebrow ? (
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.24em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mb-3 text-3xl font-semibold tracking-tight md:text-4xl">{heading}</h2>
          {intro ? <p className="text-lg leading-relaxed text-muted-foreground">{intro}</p> : null}
        </div>

        <ul className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {(services || []).map((row, index) => {
            const rowMedia = hasMedia(row.media) ? row.media : null
            const highlights = row.highlights?.filter((item) => item?.text?.trim()) ?? []
            const hasFooter = Boolean(row.pricingHint)

            return (
              <li
                key={`${row.name}-${index}`}
                className="group overflow-hidden rounded-[1.75rem] border border-border/80 bg-background/88 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden border-b border-border/80 bg-muted">
                  {rowMedia ? (
                    <>
                      <Media
                        fill
                        imgClassName="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        priority={index < 2}
                        resource={rowMedia}
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,13,25,0.08)_0%,rgba(7,13,25,0.72)_100%)]" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(86,175,255,0.22),transparent_50%),linear-gradient(180deg,rgba(242,247,255,0.9)_0%,rgba(232,240,249,0.6)_100%)]" />
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    {row.eyebrow ? (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                        {row.eyebrow}
                      </p>
                    ) : null}
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-balance">{row.name}</h3>
                  </div>
                </div>

                <div className="grid gap-5 p-5">
                  <p className="text-sm leading-7 text-muted-foreground">{row.summary}</p>

                  {highlights.length > 0 ? (
                    <ul className="grid gap-3">
                      {highlights.map((item, highlightIndex) => (
                        <li key={`${row.name}-highlight-${highlightIndex}`} className="flex gap-3 text-sm">
                          <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span className="leading-6 text-foreground/90">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {hasFooter ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-muted/35 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">
                          Priced around
                        </p>
                        <p className="mt-1 text-sm text-foreground/90">{row.pricingHint}</p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/#instant-quote">
                          Estimate
                          <ArrowRightIcon className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
