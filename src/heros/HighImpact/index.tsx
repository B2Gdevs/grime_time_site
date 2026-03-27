'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

import type { Page } from '@/payload-types'

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
      className="relative -mt-[8rem] flex min-h-[72vh] items-end overflow-hidden text-white sm:-mt-[9rem] sm:min-h-[80vh] lg:-mt-[10.4rem] lg:min-h-[88vh]"
      data-theme="dark"
    >
      <div className="absolute inset-0 -z-10 select-none">
        {media && typeof media === 'object' && (
          <Media fill imgClassName="object-cover opacity-30 saturate-[1.1]" priority resource={media} />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(86,175,255,0.18),transparent_42%),linear-gradient(180deg,rgba(7,13,25,0.2)_0%,rgba(7,13,25,0.84)_42%,rgba(7,13,25,0.98)_100%)]" />
        <div className="absolute -left-16 top-28 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="container relative z-10 flex w-full pb-10 pt-28 sm:pb-12 sm:pt-32 lg:pb-14 lg:pt-36">
        <div className="grid w-full">
          <div className="max-w-4xl">
            <div className="mb-4 inline-flex items-center rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-sm sm:mb-5 sm:px-4 sm:py-2 sm:text-xs">
              Residential exterior cleaning
            </div>

            <div
              className={cn(
                'font-sans text-[clamp(3.2rem,17vw,9.5rem)] font-black uppercase leading-[0.9] tracking-[-0.06em] text-white drop-shadow-[0_18px_48px_rgba(0,0,0,0.35)]',
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

            <div className="mt-4 max-w-xl rounded-[1.25rem] border border-white/12 bg-white/8 p-3.5 shadow-2xl shadow-black/25 backdrop-blur-md sm:mt-5 sm:rounded-[1.4rem] sm:p-4">
              {richText ? (
                <RichText
                  className="[&_h1]:hidden [&_p]:mb-0 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-white/84 sm:[&_p]:text-base"
                  data={richText}
                  enableGutter={false}
                  enableProse={false}
                />
              ) : null}
            </div>

            {Array.isArray(links) && links.length > 0 && (
              <ul className="mt-6 grid gap-3 sm:mt-7 sm:flex sm:flex-wrap sm:gap-4">
                {links.map(({ link }, i) => {
                  return (
                    <li key={i} className="sm:w-auto">
                      <CMSLink {...link} />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
