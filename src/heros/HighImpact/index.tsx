'use client'

import Link from 'next/link'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

import type { Page } from '@/payload-types'

import { Media } from '@/components/Media'
import { Button } from '@/components/ui/button'

export const HighImpactHero: React.FC<Page['hero']> = ({ media }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  })

  return (
    <div
      className="marketing-high-impact-hero relative flex min-h-[58vh] items-end overflow-hidden text-white sm:min-h-[64vh] lg:min-h-[68vh]"
      data-theme="dark"
    >
      <div className="absolute inset-0 -z-10 select-none">
        {media && typeof media === 'object' && (
          <Media fill imgClassName="object-cover opacity-26 saturate-[1.06]" priority resource={media} />
        )}
        <div className="hero-denim-noise absolute inset-0 opacity-35" />
        <div className="hero-denim-noise-drift absolute inset-0 opacity-22" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(86,175,255,0.22),transparent_42%),linear-gradient(180deg,rgba(7,13,25,0.28)_0%,rgba(7,13,25,0.84)_42%,rgba(7,13,25,0.98)_100%)]" />
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute bottom-6 right-0 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

        {/* Animated bubbles (Magic UI style ambient motion) */}
        <div
          className="noise-orb pointer-events-none absolute left-[8%] top-[18%] h-32 w-32 rounded-full border border-white/25 bg-cyan-300/28 blur-xl"
          aria-hidden
        />
        <div
          className="noise-orb noise-orb-delayed pointer-events-none absolute right-[11%] top-[24%] h-24 w-24 rounded-full border border-white/20 bg-primary/35 blur-xl"
          aria-hidden
        />
        <div
          className="noise-orb pointer-events-none absolute bottom-[22%] left-[16%] h-20 w-20 rounded-full border border-white/20 bg-white/20 blur-xl"
          style={{ animationDelay: '-2s' }}
          aria-hidden
        />
        <div
          className="noise-orb noise-orb-delayed pointer-events-none absolute bottom-[18%] right-[18%] h-16 w-16 rounded-full border border-white/20 bg-cyan-200/22 blur-lg"
          style={{ animationDelay: '-4.2s' }}
          aria-hidden
        />
      </div>

      <div className="container relative z-10 w-full pb-10 pt-18 sm:pb-14 sm:pt-20 lg:pb-16 lg:pt-24">
        <div className="mx-auto max-w-5xl">
          <div className="hero-glass-float rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/35 backdrop-blur-md sm:p-8 lg:p-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/65 sm:text-xs">
              North Texas
            </p>
            <h1 className="font-sans text-[clamp(2.8rem,15vw,7.8rem)] font-black uppercase leading-[0.9] tracking-[-0.06em] text-white drop-shadow-[0_18px_48px_rgba(0,0,0,0.35)]">
              Grime Time
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
              We are the most transparent when it comes to pricing services for our customers.
            </p>

            <Button asChild className="mt-7 h-12 rounded-xl px-6 text-base font-semibold shadow-lg shadow-primary/25" size="lg">
              <Link href="/#instant-quote">Get an instant quote</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
