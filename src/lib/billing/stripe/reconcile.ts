import type Stripe from 'stripe'
import type { Payload } from 'payload'

import { fromMinorUnits, timestampToIso } from '@/lib/billing/amounts'
import type { Invoice, ServicePlan } from '@/payload-types'

function mapStripeInvoiceStatus(invoice: Stripe.Invoice): Invoice['status'] {
  if (invoice.status === 'paid') {
    if ((invoice.post_payment_credit_notes_amount ?? 0) > 0 || (invoice.pre_payment_credit_notes_amount ?? 0) > 0) {
      return invoice.amount_remaining > 0 ? 'partially_paid' : 'paid'
    }

    return 'paid'
  }

  if (invoice.status === 'void') {
    return 'void'
  }

  if (invoice.status === 'uncollectible') {
    return 'uncollectible'
  }

  if (invoice.status === 'draft') {
    return 'draft'
  }

  if ((invoice.amount_paid ?? 0) > 0 && (invoice.amount_remaining ?? 0) > 0) {
    return 'partially_paid'
  }

  if (invoice.due_date && invoice.amount_remaining > 0 && invoice.due_date * 1000 < Date.now()) {
    return 'overdue'
  }

  return 'open'
}

function mapInvoiceDeliveryStatus(invoice: Stripe.Invoice): Invoice['deliveryStatus'] {
  if (invoice.status_transitions.paid_at) return 'viewed'
  if (invoice.status_transitions.finalized_at) return 'sent'
  if (invoice.last_finalization_error) return 'failed'
  if (invoice.id) return 'queued'
  return 'draft'
}

function mapServicePlanStatus(subscription: Stripe.Subscription): ServicePlan['status'] {
  switch (subscription.status) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'paused':
    case 'past_due':
    case 'incomplete':
      return 'paused'
    case 'canceled':
    case 'unpaid':
      return 'cancelled'
    default:
      return 'draft'
  }
}

function getStripeInvoicePaymentIntentId(invoice: Stripe.Invoice) {
  const payment = invoice.payments?.data?.find(
    (entry) => entry.payment.type === 'payment_intent' && entry.payment.payment_intent,
  )

  if (!payment?.payment.payment_intent) {
    return undefined
  }

  return typeof payment.payment.payment_intent === 'string'
    ? payment.payment.payment_intent
    : payment.payment.payment_intent.id
}

export async function reconcileStripeInvoice(args: {
  eventId?: null | string
  internalInvoice: Invoice
  invoice: Stripe.Invoice
  payload: Payload
}) {
  const { eventId, internalInvoice, invoice, payload } = args
  const stripePaymentIntentID = getStripeInvoicePaymentIntentId(invoice)
  const paidOutOfBand = internalInvoice.paidOutOfBand ?? false

  return payload.update({
    collection: 'invoices',
    id: internalInvoice.id,
    data: {
      balanceDue: fromMinorUnits(invoice.amount_remaining),
      deliveryStatus: mapInvoiceDeliveryStatus(invoice),
      dueDate: timestampToIso(invoice.due_date) ?? internalInvoice.dueDate,
      lastStripeEventID: eventId || undefined,
      lastStripeSyncAt: new Date().toISOString(),
      paidAt: timestampToIso(invoice.status_transitions.paid_at) ?? internalInvoice.paidAt,
      paidOutOfBand,
      paymentCollectionMethod: invoice.collection_method,
      paymentSource: paidOutOfBand
        ? internalInvoice.paymentSource || 'other'
        : invoice.status === 'paid' && stripePaymentIntentID
          ? 'stripe'
          : internalInvoice.paymentSource,
      paymentUrl: invoice.hosted_invoice_url || internalInvoice.paymentUrl,
      status: mapStripeInvoiceStatus(invoice),
      stripeCustomerID: typeof invoice.customer === 'string' ? invoice.customer : internalInvoice.stripeCustomerID,
      stripeHostedInvoiceURL: invoice.hosted_invoice_url || internalInvoice.stripeHostedInvoiceURL,
      stripeInvoiceID: invoice.id,
      stripeInvoiceStatus: invoice.status || undefined,
      stripePaymentIntentID: stripePaymentIntentID || internalInvoice.stripePaymentIntentID,
      total: fromMinorUnits(invoice.total),
    },
  })
}

export async function reconcileStripeSubscription(args: {
  eventId?: null | string
  payload: Payload
  servicePlan: ServicePlan
  subscription: Stripe.Subscription
}) {
  const { eventId, payload, servicePlan, subscription } = args
  const currentItem = subscription.items.data[0]

  return payload.update({
    collection: 'service-plans',
    id: servicePlan.id,
    data: {
      currentPeriodEnd: timestampToIso(currentItem?.current_period_end),
      currentPeriodStart: timestampToIso(currentItem?.current_period_start),
      nextInvoiceAt: timestampToIso(currentItem?.current_period_end),
      stripeCustomerID:
        typeof subscription.customer === 'string' ? subscription.customer : servicePlan.stripeCustomerID,
      stripeSubscriptionID: subscription.id,
      stripeSubscriptionStatus: subscription.status,
      status: mapServicePlanStatus(subscription),
    },
  })
}
