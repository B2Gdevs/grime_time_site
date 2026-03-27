'use client'

import Link from 'next/link'
import {
  ClipboardListIcon,
  Clock3Icon,
  ListChecksIcon,
  LockKeyholeIcon,
  ReceiptTextIcon,
  RotateCcwIcon,
  ScaleIcon,
} from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

const useCases = [
  {
    body: 'Follow-up on an existing service, job concern, or account question.',
    icon: ListChecksIcon,
  },
  {
    body: 'Billing, refund, privacy, or terms questions that need a tracked reply.',
    icon: ScaleIcon,
  },
  {
    body: 'Commercial walkthrough requests and property-specific notes before booking.',
    icon: ClipboardListIcon,
  },
] as const

const responseLines = [
  'General contact requests: reply target within 1 business day.',
  'Billing, refund, and privacy requests: acknowledgement target within 1 business day.',
  'Formal review items: first update target within 3 business days.',
] as const

const beforeSend = [
  'Include the property address if the question is tied to a job or invoice.',
  'Tell us whether you want an email, call, or text back.',
  'Use the topic dropdown so the team can route privacy, refund, and support requests correctly.',
] as const

function TabTriggerInner({
  Icon,
  label,
}: {
  Icon: typeof ListChecksIcon | typeof Clock3Icon | typeof ScaleIcon | typeof ClipboardListIcon
  label: string
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Icon className="size-4 shrink-0 text-primary" aria-hidden />
      <span className="truncate text-left text-xs font-medium leading-tight sm:text-sm">{label}</span>
    </span>
  )
}

export function ContactGuidancePanel() {
  return (
    <Tabs defaultValue="use" className="w-full">
      <TabsList
        className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-border bg-muted/70 p-1.5 sm:grid-cols-4"
        aria-label="Contact guidance sections"
      >
        <TabsTrigger value="use" className="justify-start px-2.5 py-2 sm:justify-center">
          <TabTriggerInner Icon={ListChecksIcon} label="Best use" />
        </TabsTrigger>
        <TabsTrigger value="timing" className="justify-start px-2.5 py-2 sm:justify-center">
          <TabTriggerInner Icon={Clock3Icon} label="Reply times" />
        </TabsTrigger>
        <TabsTrigger value="policies" className="justify-start px-2.5 py-2 sm:justify-center">
          <TabTriggerInner Icon={ScaleIcon} label="Policies" />
        </TabsTrigger>
        <TabsTrigger value="checklist" className="justify-start px-2.5 py-2 sm:justify-center">
          <TabTriggerInner Icon={ClipboardListIcon} label="Before you send" />
        </TabsTrigger>
      </TabsList>

      <div className="mt-3 rounded-2xl border border-border bg-background/95 p-4 shadow-sm sm:p-5">
        <TabsContent value="use" className="m-0">
          <ul className="grid gap-3 text-sm leading-6 text-foreground">
            {useCases.map((row) => {
              const RowIcon = row.icon
              return (
                <li key={row.body} className="flex gap-3">
                  <div className="mt-0.5 shrink-0 rounded-lg border border-border/80 bg-card p-1.5 text-primary">
                    <RowIcon className="size-4" aria-hidden />
                  </div>
                  <span>{row.body}</span>
                </li>
              )
            })}
          </ul>
        </TabsContent>

        <TabsContent value="timing" className="m-0">
          <ul className="grid gap-3 text-sm leading-6 text-foreground">
            {responseLines.map((line) => (
              <li key={line} className="flex gap-2">
                <Clock3Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="policies" className="m-0">
          <p className="mb-4 text-sm leading-6 text-muted-foreground">
            Full policy text lives on these pages. On mobile, open only what you need instead of reading every policy card.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {supportLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-xl border border-border/80 bg-card/80 p-3 shadow-sm transition-colors hover:border-primary/45 hover:bg-background"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg border border-border/70 bg-background p-2 text-primary">
                      <Icon className="size-4" aria-hidden />
                    </div>
                    <div className="grid min-w-0 gap-1">
                      <span className="font-medium text-foreground transition-colors group-hover:text-primary">
                        {item.title}
                      </span>
                      <span className="text-sm leading-6 text-muted-foreground">{item.description}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="m-0">
          <ul className="grid gap-3 text-sm leading-6 text-foreground">
            {beforeSend.map((line) => (
              <li key={line} className="flex gap-2">
                <ClipboardListIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </TabsContent>
      </div>
    </Tabs>
  )
}
