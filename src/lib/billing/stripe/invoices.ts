import type Stripe from 'stripe'
import type { Payload } from 'payload'

import { toMinorUnits } from '@/lib/billing/amounts'
import { createBillingEvent } from '@/lib/billing/events'
import { resolveCustomerUser } from '@/lib/billing/resolveCustomerUser'
import { getStripeOrThrow } from '@/lib/billing/stripe/client'
import { ensureStripeCustomer } from '@/lib/billing/stripe/customers'
import { reconcileStripeInvoice } from '@/lib/billing/stripe/reconcile'
import type { Account, Invoice, User } from '@/payload-types'

type SyncInvoiceToStripeArgs = {
  account: Account
  actor?: null | User
  invoice: Invoice
  payload: Payload
}

type StripeInvoiceActionArgs = SyncInvoiceToStripeArgs & {
  amount?: number
  note?: null | string
  paymentSource?: Invoice['paymentSource']
  paymentReference?: null | string
}

async function createInvoiceItems(args: { customerId: string; invoice: Invoice; stripe: Stripe }) {
  await Promise.all(
    (args.invoice.lineItems || []).map((lineItem) =>
      args.stripe.invoiceItems.create({
        amount: toMinorUnits(lineItem.amount),
        currency: 'usd',
        customer: args.customerId,
        description: lineItem.description,
      }),
    ),
  )
}

function daysUntilDue(invoice: Invoice) {
  if (!invoice.dueDate) {
    return undefined
  }

  const diff = new Date(invoice.dueDate).getTime() - Date.now()
  const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  return Number.isFinite(days) ? days : undefined
}

export async function syncInvoiceToStripe(args: SyncInvoiceToStripeArgs) {
  const { account, actor, invoice, payload } = args
  const stripe = getStripeOrThrow()
  const customerUser = await resolveCustomerUser({
    payload,
    user: invoice.customerUser,
  })
  const customerId = await ensureStripeCustomer({
    account,
    payload,
    user: customerUser || actor || null,
  })

  let stripeInvoice: Stripe.Invoice

  if (invoice.stripeInvoiceID?.trim()) {
    stripeInvoice = await stripe.invoices.retrieve(invoice.stripeInvoiceID.trim())
  } else {
    await createInvoiceItems({
      customerId,
      invoice,
      stripe,
    })

    stripeInvoice = await stripe.invoices.create({
      auto_advance: false,
      collection_method: invoice.paymentCollectionMethod || 'send_invoice',
      customer: customerId,
      days_until_due:
        (invoice.paymentCollectionMethod || 'send_invoice') === 'send_invoice'
          ? daysUntilDue(invoice)
          : undefined,
      description: invoice.title,
      metadata: {
        accountId: String(account.id),
        internalInvoiceId: String(invoice.id),
      },
    })
  }

  const finalized =
    stripeInvoice.status === 'draft' && stripeInvoice.id
      ? await stripe.invoices.finalizeInvoice(stripeInvoice.id, {
          auto_advance: true,
        })
      : stripeInvoice

  const sent =
    finalized.id && finalized.collection_method === 'send_invoice' && finalized.status !== 'paid'
      ? await stripe.invoices.sendInvoice(finalized.id)
      : finalized

  const reconciledInvoice = await reconcileStripeInvoice({
    internalInvoice: invoice,
    invoice: sent,
    payload,
  })

  await createBillingEvent({
    accountId: account.id,
    actorId: actor?.id,
    customerUserId:
      typeof invoice.customerUser === 'number' || typeof invoice.customerUser === 'string'
        ? invoice.customerUser
        : invoice.customerUser?.id,
    eventLabel: `Synced invoice ${invoice.invoiceNumber} to Stripe`,
    eventType: 'invoice_synced',
    invoiceId: invoice.id,
    occurredAt: new Date().toISOString(),
    payload,
    payloadSnapshot: {
      invoiceId: sent.id,
      status: sent.status,
    },
    processedAt: new Date().toISOString(),
    sourceSystem: 'internal',
    stripeObjectID: sent.id,
  })

  return reconciledInvoice as Invoice
}

export async function markInvoicePaidOutOfBand(args: StripeInvoiceActionArgs) {
  const { account, actor, invoice, note, payload, paymentReference, paymentSource } = args
  const stripe = getStripeOrThrow()

  let latestInvoice = invoice

  if (invoice.stripeInvoiceID?.trim()) {
    const paid = await stripe.invoices.pay(invoice.stripeInvoiceID.trim(), {
      paid_out_of_band: true,
    })

    latestInvoice = (await reconcileStripeInvoice({
      internalInvoice: invoice,
      invoice: paid,
      payload,
    })) as Invoice

    latestInvoice = (await payload.update({
      collection: 'invoices',
      id: latestInvoice.id,
      data: {
        paymentReference: paymentReference || undefined,
        paymentSource: paymentSource || invoice.paymentSource || 'other',
      },
    })) as Invoice
  } else {
    latestInvoice = (await payload.update({
      collection: 'invoices',
      id: invoice.id,
      data: {
        balanceDue: 0,
        paidAt: new Date().toISOString(),
        paidOutOfBand: true,
        paymentReference: paymentReference || undefined,
        paymentSource: paymentSource || invoice.paymentSource || 'other',
        status: 'paid',
      },
    })) as Invoice
  }

  await createBillingEvent({
    accountId: account.id,
    actorId: actor?.id,
    amount: latestInvoice.total,
    customerUserId:
      typeof latestInvoice.customerUser === 'number' || typeof latestInvoice.customerUser === 'string'
        ? latestInvoice.customerUser
        : latestInvoice.customerUser?.id,
    eventLabel: `Recorded payment for ${latestInvoice.invoiceNumber}`,
    eventType: 'payment_recorded',
    invoiceId: latestInvoice.id,
    notes: note || undefined,
    payload,
    paymentReference: paymentReference || undefined,
    paymentSource: paymentSource || latestInvoice.paymentSource || 'other',
    processedAt: new Date().toISOString(),
    reason: 'Marked paid out of band',
  })

  return latestInvoice
}

export async function applyInvoiceCredit(args: StripeInvoiceActionArgs & { action: 'apply_discount' | 'issue_credit' }) {
  const { account, action, actor, amount = 0, invoice, note, payload } = args
  const stripe = getStripeOrThrow()

  if (!invoice.stripeInvoiceID?.trim()) {
    const fieldName = action === 'apply_discount' ? 'discountAmount' : 'creditAmount'
    const nextInvoice = (await payload.update({
      collection: 'invoices',
      id: invoice.id,
      data: {
        adjustmentReason: note || undefined,
        [fieldName]: (invoice[fieldName] || 0) + amount,
        balanceDue: Math.max(0, (invoice.balanceDue || 0) - amount),
      },
    })) as Invoice

    await createBillingEvent({
      accountId: account.id,
      actorId: actor?.id,
      amount,
      customerUserId:
        typeof invoice.customerUser === 'number' || typeof invoice.customerUser === 'string'
          ? invoice.customerUser
          : invoice.customerUser?.id,
      eventLabel:
        action === 'apply_discount'
          ? `Applied discount to ${invoice.invoiceNumber}`
          : `Issued courtesy credit for ${invoice.invoiceNumber}`,
      eventType: action === 'apply_discount' ? 'discount_applied' : 'credit_issued',
      invoiceId: invoice.id,
      notes: note || undefined,
      payload,
      processedAt: new Date().toISOString(),
      reason: note || undefined,
    })

    return nextInvoice
  }

  const creditNote = await stripe.creditNotes.create({
    amount: toMinorUnits(amount),
    invoice: invoice.stripeInvoiceID.trim(),
    memo: note || undefined,
    reason: action === 'apply_discount' ? 'order_change' : 'product_unsatisfactory',
  })

  const stripeInvoice = await stripe.invoices.retrieve(invoice.stripeInvoiceID.trim())
  const reconciledInvoice = (await reconcileStripeInvoice({
    internalInvoice: invoice,
    invoice: stripeInvoice,
    payload,
  })) as Invoice

  await createBillingEvent({
    accountId: account.id,
    actorId: actor?.id,
    amount,
    customerUserId:
      typeof invoice.customerUser === 'number' || typeof invoice.customerUser === 'string'
        ? invoice.customerUser
        : invoice.customerUser?.id,
    eventLabel:
      action === 'apply_discount'
        ? `Applied discount to ${invoice.invoiceNumber}`
        : `Issued courtesy credit for ${invoice.invoiceNumber}`,
    eventType: action === 'apply_discount' ? 'discount_applied' : 'credit_issued',
    invoiceId: invoice.id,
    notes: note || undefined,
    payload,
    processedAt: new Date().toISOString(),
    reason: note || undefined,
    sourceSystem: 'internal',
    stripeObjectID: creditNote.id,
  })

  return reconciledInvoice
}

export async function refundInvoice(args: StripeInvoiceActionArgs) {
  const { account, actor, amount = 0, invoice, note, payload } = args
  const stripe = getStripeOrThrow()

  if (!invoice.stripePaymentIntentID?.trim()) {
    throw new Error('This invoice does not have a Stripe payment intent to refund.')
  }

  const refund = await stripe.refunds.create({
    amount: amount > 0 ? toMinorUnits(amount) : undefined,
    payment_intent: invoice.stripePaymentIntentID.trim(),
    reason: 'requested_by_customer',
  })

  const refundedAmount = refund.amount / 100

  const updated = (await payload.update({
    collection: 'invoices',
    id: invoice.id,
    data: {
      adjustmentReason: note || undefined,
      refundedAmount: (invoice.refundedAmount || 0) + refundedAmount,
      status: refundedAmount >= (invoice.total || 0) ? 'refunded' : invoice.status,
    },
  })) as Invoice

  await createBillingEvent({
    accountId: account.id,
    actorId: actor?.id,
    amount: refundedAmount,
    customerUserId:
      typeof invoice.customerUser === 'number' || typeof invoice.customerUser === 'string'
        ? invoice.customerUser
        : invoice.customerUser?.id,
    eventLabel: `Issued refund for ${invoice.invoiceNumber}`,
    eventType: 'refund_issued',
    invoiceId: invoice.id,
    notes: note || undefined,
    payload,
    processedAt: new Date().toISOString(),
    reason: note || undefined,
    sourceSystem: 'internal',
    stripeObjectID: refund.id,
  })

  return updated
}

export async function markInvoiceUncollectible(args: SyncInvoiceToStripeArgs & { note?: null | string }) {
  const { account, actor, invoice, note, payload } = args
  const stripe = getStripeOrThrow()

  let nextInvoice = invoice

  if (invoice.stripeInvoiceID?.trim()) {
    await stripe.invoices.markUncollectible(invoice.stripeInvoiceID.trim())
  }

  nextInvoice = (await payload.update({
    collection: 'invoices',
    id: invoice.id,
    data: {
      adjustmentReason: note || undefined,
      status: 'uncollectible',
      writeOffAmount: invoice.balanceDue || invoice.total || 0,
    },
  })) as Invoice

  await createBillingEvent({
    accountId: account.id,
    actorId: actor?.id,
    amount: nextInvoice.writeOffAmount || 0,
    customerUserId:
      typeof invoice.customerUser === 'number' || typeof invoice.customerUser === 'string'
        ? invoice.customerUser
        : invoice.customerUser?.id,
    eventLabel: `Marked ${invoice.invoiceNumber} uncollectible`,
    eventType: 'write_off_applied',
    invoiceId: invoice.id,
    notes: note || undefined,
    payload,
    processedAt: new Date().toISOString(),
    reason: note || undefined,
  })

  return nextInvoice
}
