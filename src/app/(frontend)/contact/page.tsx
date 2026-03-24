import type { Metadata } from 'next'

import { NoiseBackground } from '@/components/NoiseBackground'
import { ContactRequestForm } from '@/components/forms/ContactRequestForm'

export const metadata: Metadata = {
  title: 'Contact',
}

export default function ContactPage() {
  return (
    <main className="container py-24">
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-card via-card to-secondary/30 shadow-[0_20px_80px_-50px_rgba(15,23,42,0.45)]">
        <NoiseBackground className="opacity-80" contrast="light" />

        <div className="grid gap-8 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div className="grid content-start gap-6">
            <div className="grid gap-4">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">
                Contact
              </p>
              <h1 className="max-w-lg text-4xl font-semibold tracking-tight sm:text-5xl">
                Ask about service, scope, or the next available window.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                Use this when you are not ready for the instant quote or the schedule request. We
                will still capture the lead, assign follow-up, and respond with a real next step.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                Best use
              </p>
              <div className="mt-4 grid gap-4 text-sm leading-6 text-muted-foreground">
                <p>Service questions before you are ready to schedule.</p>
                <p>Commercial walkthrough requests and property-specific notes.</p>
                <p>Follow-up on a previous wash, maintenance plan, or repeat-work idea.</p>
              </div>
            </div>
          </div>

          <ContactRequestForm />
        </div>
      </div>
    </main>
  )
}
