import type { Metadata } from 'next'

import Link from 'next/link'
import {
  Clock3Icon,
  LockKeyholeIcon,
  ReceiptTextIcon,
  RotateCcwIcon,
} from 'lucide-react'

import { NoiseBackground } from '@/components/NoiseBackground'
import { ContactRequestForm } from '@/components/forms/ContactRequestForm'

export const metadata: Metadata = {
  title: 'Contact and support',
  description:
    'Contact Grime Time for support, billing, privacy, policy, scheduling, or service questions.',
}

const supportLinks = [
  {
    description: 'How we handle customer information and data requests.',
    href: '/privacy-policy',
    icon: LockKeyholeIcon,
    title: 'Data privacy',
  },
  {
    description: 'Service expectations, scope, scheduling, and payment basics.',
    href: '/terms-and-conditions',
    icon: ReceiptTextIcon,
    title: 'Terms and conditions',
  },
  {
    description: 'How billing reviews, touch-ups, and refund requests are handled.',
    href: '/refund-policy',
    icon: RotateCcwIcon,
    title: 'Refund policy',
  },
  {
    description: 'The response windows we aim to hold for support and follow-up.',
    href: '/contact-sla',
    icon: Clock3Icon,
    title: 'Contact SLA',
  },
] as const

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
                Reach the team without turning everything into a quote.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                Use this for customer support, billing, refund questions, privacy requests, policy
                questions, or general service follow-up. We still capture the request, assign
                follow-up, and respond with a real next step.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                Best use
              </p>
              <div className="mt-4 grid gap-4 text-sm leading-6 text-muted-foreground">
                <p>Follow-up on an existing service, job concern, or account question.</p>
                <p>Billing, refund, privacy, or terms questions that need a tracked reply.</p>
                <p>Commercial walkthrough requests and property-specific notes before booking.</p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                Support standards
              </p>
              <div className="mt-4 grid gap-4 text-sm leading-6 text-muted-foreground">
                <p>General contact requests: reply target within 1 business day.</p>
                <p>Billing, refund, and privacy requests: acknowledgement target within 1 business day.</p>
                <p>Formal review items: first update target within 3 business days.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {supportLinks.map((item) => {
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-[1.25rem] border border-border/80 bg-background/80 p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-background"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl border border-border/70 bg-card/90 p-2 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <div className="grid gap-1">
                        <div className="font-medium text-foreground transition-colors group-hover:text-primary">
                          {item.title}
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="rounded-[1.5rem] border border-border/80 bg-background/80 p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
                Before you send it
              </p>
              <div className="mt-4 grid gap-4 text-sm leading-6 text-muted-foreground">
                <p>Include the property address if the question is tied to a job or invoice.</p>
                <p>Tell us whether you want an email, call, or text back.</p>
                <p>Use the dropdown so the team can route privacy, refund, and support requests correctly.</p>
              </div>
            </div>
          </div>

          <ContactRequestForm />
        </div>
      </div>
    </main>
  )
}
