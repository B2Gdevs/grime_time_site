import type { Payload } from 'payload'

import { resolveActiveBillingDiscount } from '@/lib/billing/discountPolicy'
import { formatCurrency, formatDate, sentenceCase } from '@/lib/customers/format'
import { scopeWhereForAccount } from '@/lib/demo/scopeWhere'
import type { Invoice, ServiceAppointment, ServicePlan, User } from '@/payload-types'
import type { Where } from 'payload'

export type BillingWorkspaceMetric = {
  label: string
  tone: 'default' | 'positive' | 'warning'
  value: string
}

export type BillingWorkspaceInvoiceItem = {
  accountName: null | string
  activeDiscountAmount: number
  activeDiscountLabel: string
  activeDiscountNote: null | string
  activeDiscountSource: 'account' | 'none' | 'user'
  balanceDue: number
  collectionMethod: null | string
  deliveryStatus: null | string
  dueDate: null | string
  id: string
  invoiceNumber: string
  paymentSource: null | string
  paymentUrl: null | string
  status: string
  title: string
}

export type BillingWorkspaceServicePlanItem = {
  accountName: null | string
  billingMode: null | string
  id: string
  nextInvoiceAt: null | string
  status: string
  stripeSubscriptionID: null | string
  title: string
}

export type BillingWorkspaceMonthlyCandidate = {
  accountId: string
  accountName: string
  billableAmount: number
  billingTermsDays: number
  readyCount: number
}

export type BillingWorkspaceData = {
  generatedAt: string
  invoices: BillingWorkspaceInvoiceItem[]
  metrics: BillingWorkspaceMetric[]
  monthlyCandidates: BillingWorkspaceMonthlyCandidate[]
  servicePlans: BillingWorkspaceServicePlanItem[]
}

function invoiceSortValue(invoice: Invoice) {
  return invoice.dueDate ? new Date(invoice.dueDate).getTime() : Number.MAX_SAFE_INTEGER
}

function servicePlanSortValue(servicePlan: ServicePlan) {
  return servicePlan.nextInvoiceAt ? new Date(servicePlan.nextInvoiceAt).getTime() : Number.MAX_SAFE_INTEGER
}

function mapAccountName(value: Invoice['account'] | ServiceAppointment['account'] | ServicePlan['account']) {
  return typeof value === 'object' ? value?.name ?? null : null
}

export async function loadBillingWorkspace(args: {
  demoAccountIds?: number[] | null
  payload: Payload
  user: User
}) {
  const { demoAccountIds = null, payload, user } = args
  const invoiceWhere: Where = {
    status: {
      in: ['open', 'overdue', 'partially_paid', 'uncollectible'],
    },
  }
  const servicePlanWhere: Where = {
    and: [
      {
        status: {
          in: ['draft', 'active', 'paused'],
        },
      },
      {
        billingMode: {
          in: ['autopay_subscription', 'subscription_send_invoice'],
        },
      },
    ],
  }
  const appointmentWhere: Where = {
    billableStatus: {
      equals: 'ready_to_bill',
    },
  }

  const [invoicesResult, servicePlansResult, appointmentsResult] = await Promise.all([
    payload.find({
      collection: 'invoices',
      depth: 1,
      limit: 12,
      overrideAccess: false,
      sort: 'dueDate',
      user,
      where: scopeWhereForAccount(invoiceWhere, demoAccountIds ?? null) ?? invoiceWhere,
    }),
    payload.find({
      collection: 'service-plans',
      depth: 1,
      limit: 12,
      overrideAccess: false,
      sort: 'nextInvoiceAt',
      user,
      where: scopeWhereForAccount(servicePlanWhere, demoAccountIds ?? null) ?? servicePlanWhere,
    }),
    payload.find({
      collection: 'service-appointments',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      sort: '-completedAt',
      user,
      where: scopeWhereForAccount(appointmentWhere, demoAccountIds ?? null) ?? appointmentWhere,
    }),
  ])

  const invoices = (invoicesResult.docs as Invoice[])
    .sort((left, right) => invoiceSortValue(left) - invoiceSortValue(right))
    .map((invoice) => {
      const activeDiscount = resolveActiveBillingDiscount({
        account: invoice.account,
        total: invoice.balanceDue || invoice.total || 0,
        user: invoice.customerUser,
      })

      return {
        accountName: mapAccountName(invoice.account),
        activeDiscountAmount: activeDiscount.amount,
        activeDiscountLabel: activeDiscount.label,
        activeDiscountNote: activeDiscount.note,
        activeDiscountSource: activeDiscount.source,
        balanceDue: invoice.balanceDue || 0,
        collectionMethod: invoice.paymentCollectionMethod || null,
        deliveryStatus: invoice.deliveryStatus || null,
        dueDate: invoice.dueDate || null,
        id: String(invoice.id),
        invoiceNumber: invoice.invoiceNumber,
        paymentSource: invoice.paymentSource || null,
        paymentUrl: invoice.stripeHostedInvoiceURL || invoice.paymentUrl || null,
        status: invoice.status,
        title: invoice.title,
      }
    })

  const servicePlans = (servicePlansResult.docs as ServicePlan[])
    .sort((left, right) => servicePlanSortValue(left) - servicePlanSortValue(right))
    .map((servicePlan) => ({
      accountName: mapAccountName(servicePlan.account),
      billingMode: servicePlan.billingMode || null,
      id: String(servicePlan.id),
      nextInvoiceAt: servicePlan.nextInvoiceAt || null,
      status: servicePlan.status,
      stripeSubscriptionID: servicePlan.stripeSubscriptionID || null,
      title: servicePlan.title,
    }))

  const monthlyCandidateMap = new Map<string, BillingWorkspaceMonthlyCandidate>()
  for (const appointment of appointmentsResult.docs as ServiceAppointment[]) {
    const account =
      typeof appointment.account === 'object' && appointment.account ? appointment.account : null

    if (!account?.id) {
      continue
    }

    const key = String(account.id)
    const existing = monthlyCandidateMap.get(key)
    if (existing) {
      existing.billableAmount += appointment.billableAmount || 0
      existing.readyCount += 1
      continue
    }

    monthlyCandidateMap.set(key, {
      accountId: key,
      accountName: account.name,
      billableAmount: appointment.billableAmount || 0,
      billingTermsDays: account.billingTermsDays || 0,
      readyCount: 1,
    })
  }

  const monthlyCandidates = [...monthlyCandidateMap.values()].sort(
    (left, right) => right.billableAmount - left.billableAmount,
  )

  const overdue = invoices.filter((invoice) => invoice.status === 'overdue')
  const dueNowAmount = invoices.reduce((sum, invoice) => sum + invoice.balanceDue, 0)
  const pendingSend = invoices.filter(
    (invoice) => !invoice.paymentUrl && invoice.deliveryStatus !== 'sent' && invoice.status !== 'paid',
  )

  return {
    generatedAt: new Date().toISOString(),
    invoices,
    metrics: [
      {
        label: 'Open invoices',
        tone: invoices.length > 0 ? 'default' : 'positive',
        value: String(invoices.length),
      },
      {
        label: 'Overdue',
        tone: overdue.length > 0 ? 'warning' : 'positive',
        value: String(overdue.length),
      },
      {
        label: 'Balance due',
        tone: dueNowAmount > 0 ? 'default' : 'positive',
        value: formatCurrency(dueNowAmount),
      },
      {
        label: 'Needs send',
        tone: pendingSend.length > 0 ? 'warning' : 'positive',
        value: String(pendingSend.length),
      },
    ],
    monthlyCandidates,
    servicePlans,
  } satisfies BillingWorkspaceData
}

export function billingItemSummary(item: BillingWorkspaceInvoiceItem) {
  return [
    item.accountName,
    item.dueDate ? `Due ${formatDate(item.dueDate)}` : null,
    item.collectionMethod ? sentenceCase(item.collectionMethod.replaceAll('_', ' ')) : null,
  ]
    .filter(Boolean)
    .join(' | ')
}
