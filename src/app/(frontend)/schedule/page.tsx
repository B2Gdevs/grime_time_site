import type { Metadata } from 'next'

import { ScheduleRequestForm } from '@/components/forms/ScheduleRequestForm'
import { NoiseBackground } from '@/components/NoiseBackground'

export const metadata: Metadata = {
  title: 'Schedule',
  description: 'Book a service or consultation with Grime Time.',
}

export default function SchedulePage() {
  return (
    <div className="container py-24">
      <section className="site-section-shell px-6 py-8 md:px-10 md:py-10">
        <NoiseBackground className="opacity-75" contrast="light" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
          <div className="grid gap-5">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
                Book online
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                Schedule a scope review or service window.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
                Pick a time that works. If the property needs photos, access review, or special
                surface notes, we will confirm that before the final schedule is locked.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                Before you book
              </p>
              <div className="mt-4 grid gap-3 text-sm leading-7 text-muted-foreground">
                <p>Bring the property address, approximate square footage, and any gate or access notes.</p>
                <p>If the job is algae-heavy, waterfront, or commercial, use the notes field so we scope it correctly.</p>
                <p>We store the request in Payload first, then route it into the internal follow-up workflow.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/80 bg-card/78 p-5 shadow-sm md:p-6">
            <ScheduleRequestForm />
          </div>
        </div>
      </section>
    </div>
  )
}
