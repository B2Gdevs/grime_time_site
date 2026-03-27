import type { Config, Media, Page } from '@/payload-types'
import Image from 'next/image'
import React from 'react'

import RichText from '@/components/RichText'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

type Testimonial = Config['collections']['testimonials']
type TestimonialsSectionBlock = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'testimonialsBlock' }
>

async function loadLatestPublished(limit: number): Promise<Testimonial[]> {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'testimonials',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: 'sortOrder',
    where: {
      published: { equals: true },
    },
  })
  return docs as Testimonial[]
}

export async function TestimonialsBlock(props: TestimonialsSectionBlock) {
  const { heading, intro, selectionMode, testimonials: selected, limit } = props

  let items: Testimonial[] = []
  if (selectionMode === 'featuredLatest') {
    items = await loadLatestPublished(limit ?? 6)
  } else if (selected && Array.isArray(selected) && selected.length > 0) {
    items = selected.filter((t): t is Testimonial => typeof t === 'object' && t !== null)
  }

  items = items.filter((t) => t.published)

  if (items.length === 0) {
    return null
  }

  return (
    <section className="container my-16">
      <div className="site-section-shell px-6 py-10 md:px-10 md:py-12">
        {heading ? (
          <h2 className="mb-4 text-2xl font-semibold tracking-tight md:text-3xl">{heading}</h2>
        ) : null}
        {intro ? (
          <div className="mb-10 max-w-3xl text-muted-foreground">
            <RichText data={intro} enableGutter={false} />
          </div>
        ) : null}
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <li
              key={typeof t.id === 'number' ? t.id : `t-${i}`}
              className="flex flex-col rounded-2xl border border-border bg-card/80 p-5 shadow-sm"
            >
              {t.rating ? (
                <p className="mb-2 text-sm text-amber-600 dark:text-amber-500" aria-label={`${t.rating} of 5`}>
                  {'★'.repeat(Math.min(5, Math.max(1, t.rating)))}
                  <span className="sr-only">{t.rating} of 5 stars</span>
                </p>
              ) : null}
              <blockquote className="flex-1 text-pretty text-sm leading-relaxed text-foreground">
                “{t.quote}”
              </blockquote>
              <div className="mt-4 flex items-center gap-3 border-t border-border/80 pt-4">
                <TestimonialAvatar photo={t.photo} authorName={t.authorName} />
                <div className="min-w-0">
                  <div className="font-medium leading-tight">{t.authorName}</div>
                  {t.authorDetail ? (
                    <div className="text-xs text-muted-foreground">{t.authorDetail}</div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function TestimonialAvatar({
  photo,
  authorName,
}: {
  photo: number | Media | null | undefined
  authorName: string
}) {
  const media = typeof photo === 'object' && photo !== null ? photo : null
  const url = media?.url ? getMediaUrl(media.url, media.updatedAt) : ''

  if (!url) {
    return (
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
        aria-hidden
      >
        {authorName.slice(0, 1).toUpperCase()}
      </div>
    )
  }

  return (
    <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
      <Image src={url} alt="" fill className="object-cover" sizes="44px" />
    </div>
  )
}
