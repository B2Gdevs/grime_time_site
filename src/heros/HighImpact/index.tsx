'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

import type { Page } from '@/payload-types'

import { InteractiveGridPattern } from '@/components/InteractiveGridPattern'
import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { cn } from '@/utilities/ui'

export const HighImpactHero: React.FC<Page['hero']> = ({ links, media, richText }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  })

  const mediaUrl =
    media && typeof media === 'object' && typeof media.url === 'string'
      ? getMediaUrl(media.url, media.updatedAt)
      : null

  return (
    <div
      className="relative -mt-[10.4rem] flex min-h-[88vh] items-end overflow-hidden text-white"
      data-theme="dark"
    >
      <div className="absolute inset-0 -z-10 select-none">
        {media && typeof media === 'object' && (
          <Media fill imgClassName="object-cover opacity-30 saturate-[1.1]" priority resource={media} />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(86,175,255,0.18),transparent_42%),linear-gradient(180deg,rgba(7,13,25,0.2)_0%,rgba(7,13,25,0.84)_42%,rgba(7,13,25,0.98)_100%)]" />
        <div className="absolute inset-0 opacity-85 [mask-image:radial-gradient(circle_at_center,white,transparent_86%)]">
          <InteractiveGridPattern className="scale-[1.05]" squares={[28, 18]} />
        </div>
        <div className="absolute -left-16 top-28 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="container relative z-10 flex w-full pb-14 pt-36">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.2fr)_18rem] lg:items-end">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-sm">
              Residential exterior cleaning
            </div>

            <div
              className={cn(
                'font-sans text-[clamp(4.5rem,16vw,9.5rem)] font-black uppercase leading-[0.88] tracking-[-0.06em] text-white drop-shadow-[0_18px_48px_rgba(0,0,0,0.35)]',
                mediaUrl ? 'text-transparent bg-clip-text' : '',
              )}
              style={
                mediaUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0.9)), url(${mediaUrl})`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                    }
                  : undefined
              }
            >
              Grime Time
            </div>

            <div className="mt-6 max-w-2xl rounded-[2rem] border border-white/12 bg-white/8 p-6 shadow-2xl shadow-black/25 backdrop-blur-md">
              {richText ? (
                <RichText
                  className="[&_h1]:hidden [&_p]:mb-0 [&_p]:text-lg [&_p]:leading-relaxed [&_p]:text-white/84"
                  data={richText}
                  enableGutter={false}
                  enableProse={false}
                />
              ) : null}
            </div>

            {Array.isArray(links) && links.length > 0 && (
              <ul className="mt-7 flex flex-wrap gap-4">
                {links.map(({ link }, i) => {
                  return (
                    <li key={i}>
                      <CMSLink {...link} />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="grid gap-3">
            {[
              'House washing',
              'Driveways and flatwork',
              'Porches and patios',
              'Docks and waterfront surfaces',
            ].map((service) => (
              <div
                key={service}
                className="rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm font-medium text-white/88 backdrop-blur-sm"
              >
                {service}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
