import type Stripe from 'stripe'
import type { Payload } from 'payload'

import { createBillingEvent } from '@/lib/billing/events'
import { reconcileStripeInvoice, reconcileStripeSubscription } from '@/lib/billing/stripe/reconcile'
import type { Invoice, ServicePlan } from '@/payload-types'

function getStripeObjectID(value: unknown) {
  if (!value || typeof value !== 'object' || !('id' in value)) {
    return undefined
  }

  return typeof value.id === 'string' ? value.id : undefined
}

async function findInvoiceByStripeInvoiceID(args: { invoiceId: string; payload: Payload }) {
  const result = await args.payload.find({
    collection: 'invoices',
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      stripeInvoiceID: {
        equals: args.invoiceId,
      },
    },
  })

  return (result.docs[0] as Invoice | undefined) ?? null
}

async function findInvoiceByInternalID(args: { invoiceId: string; payload: Payload }) {
  const invoice = await args.payload.findByID({
    collection: 'invoices',
    depth: 0,
    id: args.invoiceId,
  }).catch(() => null)

  return invoice as Invoice | null
}

async function findInvoiceByPaymentIntent(args: { payload: Payload; paymentIntentId: string }) {
  const result = await args.payload.find({
    collection: 'invoices',
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      stripePaymentIntentID: {
        equals: args.paymentIntentId,
      },
    },
  })

  return (result.docs[0] as Invoice | undefined) ?? null
}

async function findServicePlanBySubscriptionID(args: { payload: Payload; subscriptionId: string }) {
  const result = await args.payload.find({
    collection: 'service-plans',
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      stripeSubscriptionID: {
        equals: args.subscriptionId,
      },
    },
  })

  return (result.docs[0] as ServicePlan | undefined) ?? null
}

async function billingEventExists(args: { eventId: string; payload: Payload }) {
  const result = await args.payload.find({
    collection: 'billing-events',
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      stripeEventID: {
        equals: args.eventId,
      },
    },
  })

  return result.totalDocs > 0
}

async function handleStripeInvoiceEvent(args: {
  event: Stripe.Event
  invoice: Stripe.Invoice
  payload: Payload
}) {
  const { event, invoice, payload } = args
  if (!invoice.id) {
    return
  }

  const metadataInvoiceId =
    typeof invoice.metadata?.internalInvoiceId === 'string' ? invoice.metadata.internalInvoiceId : null
  const internalInvoice =
    (await findInvoiceByStripeInvoiceID({
      invoiceId: invoice.id,
      payload,
    })) ||
    (metadataInvoiceId
      ? await findInvoiceByInternalID({
          invoiceId: metadataInvoiceId,
          payload,
        })
      : null)

  if (!internalInvoice) {
    return
  }

  const reconciled = await reconcileStripeInvoice({
    eventId: event.id,
    internalInvoice,
    invoice,
    payload,
  })

  await createBillingEvent({
    accountId:
      typeof reconciled.account === 'number' || typeof reconciled.account === 'string'
        ? reconciled.account
        : reconciled.account?.id,
    amount: reconciled.total ?? 0,
    customerUserId:
      typeof reconciled.customerUser === 'number' || typeof reconciled.customerUser === 'string'
        ? reconciled.customerUser
        : reconciled.customerUser?.id,
    eventLabel: `Stripe ${event.type} for ${reconciled.invoiceNumber}`,
    eventType:
      event.type === 'invoice.sent'
        ? 'invoice_sent'
        : event.type === 'invoice.paid'
          ? 'invoice_paid'
          : event.type === 'invoice.overdue'
            ? 'invoice_overdue'
            : 'invoice_synced',
    invoiceId: reconciled.id,
    payload,
    payloadSnapshot: {
      amountDue: invoice.amount_due,
      amountRemaining: invoice.amount_remaining,
      eventType: event.type,
      invoiceId: invoice.id,
      status: invoice.status,
    },
    processedAt: new Date().toISOString(),
    sourceSystem: 'stripe',
    stripeEventID: event.id,
    stripeObjectID: invoice.id,
  })
}

async function handleStripeSubscriptionEvent(args: {
  event: Stripe.Event
  payload: Payload
  subscription: Stripe.Subscription
}) {
  const { event, payload, subscription } = args
  const internalPlan = await findServicePlanBySubscriptionID({
    payload,
    subscriptionId: subscription.id,
  })

  if (!internalPlan) {
    return
  }

  const reconciled = await reconcileStripeSubscription({
    eventId: event.id,
    payload,
    servicePlan: internalPlan,
    subscription,
  })

  await createBillingEvent({
    accountId:
      typeof reconciled.account === 'number' || typeof reconciled.account === 'string'
        ? reconciled.account
        : reconciled.account?.id,
    customerUserId:
      typeof reconciled.customerUser === 'number' || typeof reconciled.customerUser === 'string'
        ? reconciled.customerUser
        : reconciled.customerUser?.id,
    eventLabel: `Stripe ${event.type} for ${reconciled.title}`,
    eventType: 'subscription_synced',
    payload,
    payloadSnapshot: {
      eventType: event.type,
      status: subscription.status,
      subscriptionId: subscription.id,
    },
    processedAt: new Date().toISOString(),
    servicePlanId: reconciled.id,
    sourceSystem: 'stripe',
    stripeEventID: event.id,
    stripeObjectID: subscription.id,
  })
}

async function handleRefundEvent(args: { event: Stripe.Event; payload: Payload; refund: Stripe.Refund }) {
  const { event, payload, refund } = args
  const paymentIntentId =
    typeof refund.payment_intent === 'string'
      ? refund.payment_intent
      : refund.charge && typeof refund.charge !== 'string'
        ? refund.charge.payment_intent
        : null

  if (!paymentIntentId || typeof paymentIntentId !== 'string') {
    return
  }

  const invoice = await findInvoiceByPaymentIntent({
    payload,
    paymentIntentId,
  })

  if (!invoice) {
    return
  }

  const updatedInvoice = (await payload.update({
    collection: 'invoices',
    id: invoice.id,
    data: {
      refundedAmount: (invoice.refundedAmount || 0) + (refund.amount / 100),
      status: refund.amount === Math.round((invoice.total || 0) * 100) ? 'refunded' : invoice.status,
    },
  })) as Invoice

  await createBillingEvent({
    accountId:
      typeof updatedInvoice.account === 'number' || typeof updatedInvoice.account === 'string'
        ? updatedInvoice.account
        : updatedInvoice.account?.id,
    amount: refund.amount / 100,
    customerUserId:
      typeof updatedInvoice.customerUser === 'number' || typeof updatedInvoice.customerUser === 'string'
        ? updatedInvoice.customerUser
        : updatedInvoice.customerUser?.id,
    eventLabel: `Stripe refund for ${updatedInvoice.invoiceNumber}`,
    eventType: 'refund_issued',
    invoiceId: updatedInvoice.id,
    payload,
    payloadSnapshot: {
      amount: refund.amount,
      eventType: event.type,
      refundId: refund.id,
      status: refund.status,
    },
    processedAt: new Date().toISOString(),
    sourceSystem: 'stripe',
    stripeEventID: event.id,
    stripeObjectID: refund.id,
  })
}

export async function handleStripeWebhookEvent(args: { event: Stripe.Event; payload: Payload }) {
  const { event, payload } = args

  if (await billingEventExists({ eventId: event.id, payload })) {
    return { duplicate: true as const }
  }

  switch (event.type) {
    case 'invoice.created':
    case 'invoice.finalized':
    case 'invoice.paid':
    case 'invoice.payment_failed':
    case 'invoice.sent':
    case 'invoice.updated':
    case 'invoice.voided':
    case 'invoice.overdue':
      await handleStripeInvoiceEvent({
        event,
        invoice: event.data.object as Stripe.Invoice,
        payload,
      })
      break
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleStripeSubscriptionEvent({
        event,
        payload,
        subscription: event.data.object as Stripe.Subscription,
      })
      break
    case 'refund.updated':
      await handleRefundEvent({
        event,
        payload,
        refund: event.data.object as Stripe.Refund,
      })
      break
    default:
      await createBillingEvent({
        eventLabel: `Stripe ${event.type}`,
        eventType: 'webhook_received',
        payload,
      payloadSnapshot: event.data.object,
      processedAt: new Date().toISOString(),
      sourceSystem: 'stripe',
      stripeEventID: event.id,
      stripeObjectID: getStripeObjectID(event.data.object),
    })
  }

  return { duplicate: false as const }
}
