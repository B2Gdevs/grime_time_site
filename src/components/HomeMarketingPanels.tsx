import Link from 'next/link'

import { ArrowRightIcon } from 'lucide-react'

import { HomeServiceSurface } from '@/components/HomeServiceSurface'
import { NoiseBackground } from '@/components/NoiseBackground'
import { Button } from '@/components/ui/button'

export function HomeMarketingPanels() {
  return (
    <div className="container my-16 grid gap-8">
      <HomeServiceSurface />

      <section className="site-section-shell px-6 py-8 md:px-10 md:py-10">
        <NoiseBackground className="opacity-55" contrast="light" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">About Grime Time</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight">
              Founded by two young entrepreneurs building real-world experience before college.
            </h2>
            <div className="mt-6 grid gap-4 text-sm leading-7 text-muted-foreground">
              <p>
                The business started with simple work, then grew from the belief that learning how to
                sell, serve, estimate, and operate in the real world would only make formal education
                stronger later.
              </p>
              <p>
                They took what they already knew, decided not to stay small by default, and started
                building a more formidable company with better systems, better customer communication,
                and a long-term plan to scale beyond basic jobs.
              </p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-border/80 bg-background/75 p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">What that means</p>
            <div className="mt-4 grid gap-4 text-sm leading-7 text-muted-foreground">
              <p>Hungry operators, clear scope, and work that gets tighter every season.</p>
              <p>Residential first, then disciplined growth into repeat commercial work.</p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/about">
                  Read our story
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/#instant-quote">Start estimate</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section-shell px-6 py-8 md:px-10 md:py-10">
        <NoiseBackground className="opacity-70" contrast="light" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
              How the job runs
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">From instant range to real scope.</h2>
            <div className="mt-6 grid gap-4 text-sm leading-7 text-muted-foreground">
              <p>1. The customer starts with the instant quote form and gives the property details.</p>
              <p>2. We review square footage, stories, buildup, and access before confirming the real scope.</p>
              <p>3. The crew shows up in a clear window, completes the wash sequence, and closes with notes or photos when useful.</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-border/80 bg-background/70 p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              Next step
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">
              Tell us about the property and get the estimate moving.
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              The instant form is the fastest path. If the job is unusual, book online and we will
              scope it properly instead of guessing.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/#instant-quote">
                  Start instant quote
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/schedule">Book online</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
