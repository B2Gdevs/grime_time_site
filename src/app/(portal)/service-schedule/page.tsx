import Link from 'next/link'

import { CustomerScheduleRequestForm } from '@/components/portal/CustomerScheduleRequestForm'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentPayloadUser } from '@/lib/auth/getCurrentPayloadUser'
import { getCustomerPortalData } from '@/lib/customers/getCustomerPortalData'
import { formatCurrency, formatDate, sentenceCase } from '@/lib/customers/format'

export default async function ServiceSchedulePage() {
  const user = await getCurrentPayloadUser()

  if (!user) {
    return null
  }

  const portal = await getCustomerPortalData(user)

  return (
    <>
      <SiteHeader
        title="Schedule"
        description="Upcoming jobs, recurring-plan cadence, and scheduling change requests."
        actions={
          <Button asChild variant="outline">
            <Link href="/contact">Contact the team</Link>
          </Button>
        }
      />
      <div className="flex flex-1 flex-col px-4 py-6 lg:px-6" data-tour="portal-page-body">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming visits</CardTitle>
                <CardDescription>Confirmed jobs and pending requests tied to your account.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {portal.appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nothing is scheduled yet. Use the request form to lock the next visit from an accepted estimate or plan.
                  </p>
                ) : (
                  portal.appointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-xl border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">{appointment.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(appointment.scheduledStart || appointment.requestedDate)}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">{sentenceCase(appointment.status)}</div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Window: {sentenceCase(appointment.arrivalWindow)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recurring plans</CardTitle>
                <CardDescription>{portal.servicePlanDefaults.customerSummary}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {portal.plans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No recurring plan is active yet. Once one is added, the standard visit cadence and billing split will show here.
                  </p>
                ) : (
                  portal.plans.map((plan) => (
                    <div key={plan.id} className="rounded-xl border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">{plan.title}</div>
                          <div className="text-sm text-muted-foreground">{plan.serviceSummary}</div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{sentenceCase(plan.status)}</div>
                          <div>{plan.visitsPerYear} visits / year</div>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                        <p>Annual plan: {formatCurrency(plan.annualPlanAmount)}</p>
                        <p>Installment: {formatCurrency(plan.installmentAmount)}</p>
                        <p>Discount: {plan.discountPercent}% off</p>
                        <p>Cadence: every {plan.cadenceMonths} months</p>
                      </div>
                      <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                        {plan.suggestedVisits.slice(0, plan.visitsPerYear).map((visit, index) => (
                          <p key={`${plan.id}-${visit}`}>
                            Suggested visit {index + 1}: {formatDate(visit)}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Request or change a visit</CardTitle>
              <CardDescription>
                Use an accepted estimate, an active recurring plan, or an already-scheduled job as the source for the request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerScheduleRequestForm
                appointmentOptions={portal.appointments.map((appointment) => ({
                  label: `${appointment.title} - ${formatDate(appointment.scheduledStart || appointment.requestedDate)}`,
                  value: appointment.id,
                }))}
                planOptions={portal.plans.map((plan) => ({
                  label: `${plan.title} - ${plan.visitsPerYear} visits/year`,
                  value: plan.id,
                }))}
                quoteOptions={portal.estimates
                  .filter((estimate) => estimate.status === 'accepted')
                  .map((estimate) => ({
                    label: `${estimate.title} - ${formatCurrency(estimate.total)}`,
                    value: estimate.id,
                  }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
