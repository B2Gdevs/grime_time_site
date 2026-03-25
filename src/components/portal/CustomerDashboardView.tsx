import Link from 'next/link'

import { CalendarClockIcon, FileTextIcon, ReceiptTextIcon, UserRoundCogIcon } from 'lucide-react'

import { SectionCards, type SectionCardItem } from '@/components/section-cards'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { CustomerPortalSnapshot } from '@/lib/customers/getCustomerPortalData'
import { formatCurrency, formatDate, sentenceCase } from '@/lib/customers/format'

export function CustomerDashboardView({
  cards,
  portal,
  isAdminPreview = false,
}: {
  cards: SectionCardItem[]
  portal: CustomerPortalSnapshot
  /** When true, staff is previewing the customer-facing dashboard from an admin account. */
  isAdminPreview?: boolean
}) {
  const nextAppointment = portal.appointments[0]
  const nextInvoice = portal.invoices.find((invoice) => invoice.status === 'open' || invoice.status === 'overdue')
  const activePlan = portal.plans.find((plan) => plan.status === 'active')

  return (
    <>
      <SiteHeader
        title="Customer dashboard"
        description="Your estimates, invoices, schedule, and account details in one place."
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className="@container/main portal-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto overscroll-contain py-4 md:py-6"
          data-portal-scroll=""
        >
          {isAdminPreview ? (
            <div className="mx-4 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-950 dark:text-amber-50 lg:mx-6">
              <span className="font-medium">Admin preview</span>
              <span className="text-muted-foreground"> — This is the same view a customer sees. Use </span>
              <Link href="/ops" className="font-medium underline underline-offset-2">
                Ops dashboard
              </Link>
              <span className="text-muted-foreground"> for internal tools.</span>
            </div>
          ) : null}
          <SectionCards items={cards} />
          <div className="grid min-w-0 gap-4 px-4 lg:px-6 xl:grid-cols-[1.6fr_1fr]">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Handle your next service step without leaving the portal flow.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button asChild className="justify-start">
                  <Link href="/estimates">
                    <ReceiptTextIcon className="size-4" />
                    Review estimates
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/service-schedule">
                    <CalendarClockIcon className="size-4" />
                    Manage schedule
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/invoices">
                    <FileTextIcon className="size-4" />
                    Review invoices
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/account">
                    <UserRoundCogIcon className="size-4" />
                    Update account
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/#instant-quote">Request new quote</Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/contact">Contact the team</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>At a glance</CardTitle>
                <CardDescription>What matters right now for your account.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-lg border px-3 py-3">
                  <div className="font-medium">Next visit</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {nextAppointment
                      ? `${formatDate(nextAppointment.scheduledStart || nextAppointment.requestedDate)} • ${sentenceCase(nextAppointment.status)}`
                      : 'No visit is locked yet.'}
                  </div>
                </div>
                <div className="rounded-lg border px-3 py-3">
                  <div className="font-medium">Billing</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {nextInvoice
                      ? `${formatCurrency(nextInvoice.balanceDue)} due by ${formatDate(nextInvoice.dueDate)}`
                      : 'No open invoice is waiting on this account.'}
                  </div>
                </div>
                <div className="rounded-lg border px-3 py-3">
                  <div className="font-medium">Recurring service</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {activePlan
                      ? `${activePlan.visitsPerYear} visits per year • ${formatCurrency(activePlan.installmentAmount)} installments`
                      : 'No recurring plan is active yet.'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
