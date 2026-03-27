import type { Payload } from 'payload'

import { createBillingEvent } from '@/lib/billing/events'
import type { Account, Invoice, ServiceAppointment, User } from '@/payload-types'

function invoiceNumberForPeriod(args: { account: Account; periodEnd: string }) {
  const period = new Date(args.periodEnd)
  const year = period.getUTCFullYear()
  const month = String(period.getUTCMonth() + 1).padStart(2, '0')

  return `INV-${String(args.account.id)}-${year}${month}`
}

function invoiceTitleForPeriod(args: { account: Account; periodEnd: string }) {
  const period = new Date(args.periodEnd)
  const label = period.toLocaleDateString('en-US', {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  })

  return `${args.account.name} monthly service invoice (${label})`
}

export async function createMonthlyConsolidatedInvoice(args: {
  account: Account
  actor: User
  payload: Payload
  periodEnd: string
  periodStart: string
}) {
  const { account, actor, payload, periodEnd, periodStart } = args
  const invoiceNumber = invoiceNumberForPeriod({
    account,
    periodEnd,
  })

  const existingInvoice = await payload.find({
    collection: 'invoices',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user: actor,
    where: {
      invoiceNumber: {
        equals: invoiceNumber,
      },
    },
  })

  if (existingInvoice.docs[0]) {
    return existingInvoice.docs[0] as Invoice
  }

  const appointmentsResult = await payload.find({
    collection: 'service-appointments',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    user: actor,
    where: {
      and: [
        {
          account: {
            equals: account.id,
          },
        },
        {
          billableStatus: {
            equals: 'ready_to_bill',
          },
        },
        {
          completedAt: {
            greater_than_equal: periodStart,
          },
        },
        {
          completedAt: {
            less_than_equal: periodEnd,
          },
        },
      ],
    },
  })

  const appointments = appointmentsResult.docs as ServiceAppointment[]

  if (appointments.length === 0) {
    throw new Error('No completed appointments are ready to bill for that monthly window.')
  }

  const lineItems = appointments.map((appointment) => ({
    amount: appointment.billableAmount || 0,
    description: appointment.title,
  }))

  const total = lineItems.reduce((sum, lineItem) => sum + lineItem.amount, 0)
  const customerEmail =
    account.billingEmail ||
    account.accountsPayableEmail ||
    (typeof account.customerUser === 'object' ? account.customerUser?.email : '') ||
    ''

  if (!customerEmail) {
    throw new Error('This account needs a billing email or primary customer user before monthly invoicing.')
  }

  const invoice = (await payload.create({
    collection: 'invoices',
    data: {
      account: account.id,
      balanceDue: total,
      billingPeriodEnd: periodEnd,
      billingPeriodStart: periodStart,
      customerEmail,
      customerName:
        (typeof account.customerUser === 'object' ? account.customerUser?.name : null) || account.name,
      customerUser:
        typeof account.customerUser === 'number' || typeof account.customerUser === 'string'
          ? account.customerUser
          : account.customerUser?.id,
      deliveryStatus: 'draft',
      dueDate: new Date(
        new Date(periodEnd).getTime() + (account.billingTermsDays || 0) * 86400000,
      ).toISOString(),
      invoiceNumber,
      lineItems,
      paymentCollectionMethod: 'send_invoice',
      status: 'draft',
      title: invoiceTitleForPeriod({
        account,
        periodEnd,
      }),
      total,
    },
    overrideAccess: false,
    user: actor,
  })) as Invoice

  await Promise.all(
    appointments.map((appointment) =>
      payload.update({
        collection: 'service-appointments',
        id: appointment.id,
        data: {
          billableStatus: 'billed',
          billingBatchKey: invoice.invoiceNumber,
          invoice: invoice.id,
        },
        overrideAccess: false,
        user: actor,
      }),
    ),
  )

  await createBillingEvent({
    accountId: account.id,
    actorId: actor.id,
    amount: total,
    customerUserId:
      typeof invoice.customerUser === 'number' || typeof invoice.customerUser === 'string'
        ? invoice.customerUser
        : invoice.customerUser?.id,
    eventLabel: `Created monthly consolidated invoice ${invoice.invoiceNumber}`,
    eventType: 'invoice_synced',
    invoiceId: invoice.id,
    payload,
    processedAt: new Date().toISOString(),
    reason: 'Monthly consolidated billing batch',
  })

  return invoice
}
