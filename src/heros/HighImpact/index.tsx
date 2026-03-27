'use client'

import Link from 'next/link'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

import type { Page } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { cn } from '@/utilities/ui'

export const HighImpactHero: React.FC<Page['hero']> = ({ media, richText }) => {
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
      className="relative -mt-[8rem] flex min-h-[72vh] items-end overflow-hidden text-white sm:-mt-[9rem] sm:min-h-[78vh] lg:-mt-[10.4rem] lg:min-h-[84vh]"
      data-theme="dark"
    >
      <div className="absolute inset-0 -z-10 select-none">
        {media && typeof media === 'object' && (
          <Media fill imgClassName="object-cover opacity-30 saturate-[1.1]" priority resource={media} />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(86,175,255,0.18),transparent_42%),linear-gradient(180deg,rgba(7,13,25,0.2)_0%,rgba(7,13,25,0.84)_42%,rgba(7,13,25,0.98)_100%)]" />
        <div className="absolute -left-16 top-28 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

        {/* Floating bubbles — same motion family as NoiseBackground orbs */}
        <div
          className="noise-orb pointer-events-none absolute left-[6%] top-[20%] h-28 w-28 rounded-full bg-primary/30 blur-2xl"
          aria-hidden
        />
        <div
          className="noise-orb noise-orb-delayed pointer-events-none absolute right-[10%] top-[32%] h-20 w-20 rounded-full bg-cyan-200/25 blur-2xl"
          aria-hidden
        />
        <div
          className="noise-orb pointer-events-none absolute bottom-[26%] left-[18%] h-24 w-24 rounded-full bg-white/15 blur-3xl"
          style={{ animationDelay: '-3s' }}
          aria-hidden
        />
      </div>

      <div className="container relative z-10 w-full pb-10 pt-28 sm:pb-14 sm:pt-32 lg:pb-16 lg:pt-36">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:gap-14 xl:gap-20">
          <div className="min-w-0 flex-1 lg:max-w-[58%]">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55 sm:text-xs">
              North Texas
            </p>

            <div
              className={cn(
                'font-sans text-[clamp(2.75rem,14vw,7.5rem)] font-black uppercase leading-[0.92] tracking-[-0.05em] text-white drop-shadow-[0_18px_48px_rgba(0,0,0,0.35)]',
                mediaUrl ? 'bg-clip-text text-transparent' : '',
              )}
              style={
                mediaUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.92)), url(${mediaUrl})`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                    }
                  : undefined
              }
            >
              Grime Time
            </div>
          </div>

          <div className="flex w-full flex-col gap-5 lg:max-w-md lg:flex-1">
            <div
              className={cn(
                'hero-glass-float relative rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur-md sm:rounded-3xl sm:p-5',
              )}
            >
              {richText ? (
                <RichText
                  className="[&_a]:text-primary [&_a]:underline-offset-4 [&_a]:hover:text-primary/90 [&_h1]:hidden [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:sm:text-xl [&_p]:mb-0 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-white/88 sm:[&_p]:text-base"
                  data={richText}
                  enableGutter={false}
                  enableProse={false}
                />
              ) : (
                <p className="text-sm leading-relaxed text-white/88 sm:text-base">
                  Straight numbers. Clear scope. Fast follow-up.
                </p>
              )}
            </div>

            <Button
              asChild
              className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20 sm:h-12 lg:w-auto lg:self-start"
              size="lg"
            >
              <Link href="/#instant-quote">Get an instant quote</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
