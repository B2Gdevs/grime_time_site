import type { Metadata } from 'next'

import { BadgeCheckIcon } from 'lucide-react'

import { ContactGuidancePanel } from '@/components/contact/ContactGuidancePanel'
import { NoiseBackground } from '@/components/NoiseBackground'
import { ContactRequestForm } from '@/components/forms/ContactRequestForm'

export const metadata: Metadata = {
  title: 'Contact and support',
  description:
    'Contact Grime Time for support, billing, privacy, policy, scheduling, or service questions.',
}

export default function ContactPage() {
  return (
    <main className="container py-16 sm:py-20 lg:py-24">
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-card via-card to-secondary/30 shadow-[0_20px_80px_-50px_rgba(15,23,42,0.45)]">
        <NoiseBackground className="opacity-80" contrast="light" />

        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 lg:p-10">
          <div className="grid content-start gap-6">
            <div className="grid gap-4">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">
                Contact
              </p>
              <h1 className="max-w-lg text-3xl font-semibold tracking-tight sm:text-5xl">
                Reach the team without turning everything into a quote.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                Use this for customer support, billing, refund questions, privacy requests, policy
                questions, or general service follow-up. We still capture the request, assign
                follow-up, and respond with a real next step.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-4 shadow-sm sm:p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-border/70 bg-card/90 p-2 text-primary">
                  <BadgeCheckIcon className="size-4" />
                </div>
                <div className="grid gap-1 text-sm leading-6 text-muted-foreground">
                  <p className="font-medium text-foreground">Use the compact guidance panel below before sending.</p>
                  <p>On small screens we keep policy, response-time, and checklist detail behind tabs so the form stays primary.</p>
                </div>
              </div>
            </div>

            <ContactGuidancePanel />
          </div>

          <ContactRequestForm />
        </div>
      </div>
    </main>
  )
}
