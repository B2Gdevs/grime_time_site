'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { BillingInvoiceDetail } from '@/components/portal/ops/billing/BillingInvoiceDetail'
import { BillingInvoiceList } from '@/components/portal/ops/billing/BillingInvoiceList'
import { BillingMonthlyPanel } from '@/components/portal/ops/billing/BillingMonthlyPanel'
import { BillingSubscriptionPanel } from '@/components/portal/ops/billing/BillingSubscriptionPanel'
import type { BillingActionKind } from '@/components/portal/ops/billing/billingActionMeta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { BillingWorkspaceData } from '@/lib/billing/workspace'
import { sentenceCase } from '@/lib/customers/format'
import { queryKeys } from '@/lib/query/queryKeys'
import { requestJson } from '@/lib/query/request'

function startOfCurrentMonthValue() {
  const today = new Date()
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)).toISOString().slice(0, 10)
}

function endOfCurrentMonthValue() {
  const today = new Date()
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0, 23, 59, 59, 999))
    .toISOString()
    .slice(0, 10)
}

async function fetchBillingWorkspace() {
  return requestJson<BillingWorkspaceData>('/api/internal/billing/workspace', {
    cache: 'no-store',
  })
}

export function OpsBillingWorkspaceCard({ initialData }: { initialData: BillingWorkspaceData }) {
  const queryClient = useQueryClient()
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState(initialData.invoices[0]?.id ?? null)
  const [selectedServicePlanId, setSelectedServicePlanId] = React.useState(initialData.servicePlans[0]?.id ?? null)
  const [selectedMonthlyAccountId, setSelectedMonthlyAccountId] = React.useState(
    initialData.monthlyCandidates[0]?.accountId ?? null,
  )
  const [amount, setAmount] = React.useState('')
  const [note, setNote] = React.useState('')
  const [paymentSource, setPaymentSource] = React.useState('onsite')
  const [paymentReference, setPaymentReference] = React.useState('')
  const [periodStart, setPeriodStart] = React.useState(startOfCurrentMonthValue)
  const [periodEnd, setPeriodEnd] = React.useState(endOfCurrentMonthValue)
  const [serverNotice, setServerNotice] = React.useState<string | null>(null)

  const workspaceQuery = useQuery({
    initialData,
    placeholderData: (previousData) => previousData,
    queryFn: fetchBillingWorkspace,
    queryKey: queryKeys.billingWorkspace,
  })

  const actionMutation = useMutation({
    mutationFn: async (action: BillingActionKind) => {
      if (!selectedInvoiceId) {
        throw new Error('Pick an invoice first.')
      }

      return requestJson<{ id: string; paymentUrl: null | string; status: string }>('/api/internal/billing/invoice', {
        body: JSON.stringify({
          action,
          amount: amount ? Number(amount) : undefined,
          id: Number(selectedInvoiceId),
          note: note || undefined,
          paymentSource,
          paymentReference: paymentReference || undefined,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
    },
    onError: (error) => {
      setServerNotice(error instanceof Error ? error.message : 'Billing action failed.')
    },
    onSuccess: async (result) => {
      setServerNotice(`Invoice updated to ${sentenceCase(result.status)}.`)
      setAmount('')
      setNote('')
      setPaymentSource('onsite')
      setPaymentReference('')
      await queryClient.invalidateQueries({
        queryKey: queryKeys.billingWorkspace,
      })
    },
  })

  const subscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedServicePlanId) {
        throw new Error('Pick a service plan first.')
      }

      return requestJson<{ id: string; stripeSubscriptionID: null | string; status: string }>(
        '/api/internal/billing/service-plan',
        {
          body: JSON.stringify({
            id: Number(selectedServicePlanId),
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      )
    },
    onError: (error) => {
      setServerNotice(error instanceof Error ? error.message : 'Subscription sync failed.')
    },
    onSuccess: async (result) => {
      setServerNotice(
        result.stripeSubscriptionID
          ? `Service plan synced with Stripe subscription ${result.stripeSubscriptionID}.`
          : `Service plan synced to ${sentenceCase(result.status)}.`,
      )
      await queryClient.invalidateQueries({
        queryKey: queryKeys.billingWorkspace,
      })
    },
  })

  const monthlyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMonthlyAccountId) {
        throw new Error('Pick an account first.')
      }

      return requestJson<{ id: string; invoiceNumber: string; status: string }>(
        '/api/internal/billing/monthly-consolidated',
        {
          body: JSON.stringify({
            accountId: Number(selectedMonthlyAccountId),
            periodEnd: new Date(`${periodEnd}T23:59:59.999Z`).toISOString(),
            periodStart: new Date(`${periodStart}T00:00:00.000Z`).toISOString(),
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      )
    },
    onError: (error) => {
      setServerNotice(error instanceof Error ? error.message : 'Monthly billing batch failed.')
    },
    onSuccess: async (result) => {
      setServerNotice(`Created monthly invoice ${result.invoiceNumber}.`)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.billingWorkspace,
      })
    },
  })

  const selectedInvoice =
    workspaceQuery.data.invoices.find((invoice) => invoice.id === selectedInvoiceId) ??
    workspaceQuery.data.invoices[0] ??
    null
  const selectedServicePlan =
    workspaceQuery.data.servicePlans.find((servicePlan) => servicePlan.id === selectedServicePlanId) ??
    workspaceQuery.data.servicePlans[0] ??
    null
  const selectedMonthlyCandidate =
    workspaceQuery.data.monthlyCandidates.find((candidate) => candidate.accountId === selectedMonthlyAccountId) ??
    workspaceQuery.data.monthlyCandidates[0] ??
    null

  React.useEffect(() => {
    if (!selectedInvoiceId && workspaceQuery.data.invoices[0]?.id) {
      setSelectedInvoiceId(workspaceQuery.data.invoices[0].id)
    }
  }, [selectedInvoiceId, workspaceQuery.data.invoices])

  React.useEffect(() => {
    if (!selectedServicePlanId && workspaceQuery.data.servicePlans[0]?.id) {
      setSelectedServicePlanId(workspaceQuery.data.servicePlans[0].id)
    }
  }, [selectedServicePlanId, workspaceQuery.data.servicePlans])

  React.useEffect(() => {
    if (!selectedMonthlyAccountId && workspaceQuery.data.monthlyCandidates[0]?.accountId) {
      setSelectedMonthlyAccountId(workspaceQuery.data.monthlyCandidates[0].accountId)
    }
  }, [selectedMonthlyAccountId, workspaceQuery.data.monthlyCandidates])

  return (
    <Card id="billing-follow-up">
      <CardHeader>
        <CardTitle>Billing follow-up</CardTitle>
        <CardDescription>
          Send invoices, record payment outcomes, sync recurring plans, and batch monthly commercial billing without
          leaving `/ops`.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 sm:grid-cols-4">
          {workspaceQuery.data.metrics.map((metric) => (
            <div
              key={metric.label}
              className={`rounded-xl border px-3 py-3 ${
                metric.tone === 'warning' ? 'border-amber-500/30 bg-amber-500/5' : 'bg-muted/30'
              }`}
            >
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{metric.label}</div>
              <div className="mt-2 font-semibold">{metric.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid gap-3">
            <BillingInvoiceList
              invoices={workspaceQuery.data.invoices}
              selectedInvoiceId={selectedInvoiceId}
              setSelectedInvoiceId={setSelectedInvoiceId}
            />
          </div>

          <div className="grid gap-4 rounded-2xl border p-4">
            <BillingInvoiceDetail
              actionMutation={actionMutation}
              amount={amount}
              note={note}
              paymentReference={paymentReference}
              paymentSource={paymentSource}
              selectedInvoice={selectedInvoice}
              setAmount={setAmount}
              setNote={setNote}
              setPaymentReference={setPaymentReference}
              setPaymentSource={setPaymentSource}
            />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <BillingSubscriptionPanel
            selectedServicePlan={selectedServicePlan}
            selectedServicePlanId={selectedServicePlanId}
            servicePlans={workspaceQuery.data.servicePlans}
            setSelectedServicePlanId={setSelectedServicePlanId}
            subscriptionMutation={subscriptionMutation}
          />

          <BillingMonthlyPanel
            monthlyCandidates={workspaceQuery.data.monthlyCandidates}
            monthlyMutation={monthlyMutation}
            periodEnd={periodEnd}
            periodStart={periodStart}
            selectedMonthlyAccountId={selectedMonthlyAccountId}
            selectedMonthlyCandidate={selectedMonthlyCandidate}
            setPeriodEnd={setPeriodEnd}
            setPeriodStart={setPeriodStart}
            setSelectedMonthlyAccountId={setSelectedMonthlyAccountId}
          />
        </div>

        {serverNotice ? <div className="text-sm text-muted-foreground">{serverNotice}</div> : null}
      </CardContent>
    </Card>
  )
}
