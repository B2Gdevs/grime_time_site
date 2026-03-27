import type Stripe from 'stripe'
import type { Payload } from 'payload'

import { createBillingEvent } from '@/lib/billing/events'
import { resolveCustomerUser } from '@/lib/billing/resolveCustomerUser'
import { ensureStripeCustomer } from './customers'
import { getStripeOrThrow } from './client'
import { reconcileStripeSubscription } from './reconcile'
import type { Account, ServicePlan, User } from '@/payload-types'

type SyncServicePlanArgs = {
  account: Account
  payload: Payload
  plan: ServicePlan
  user?: null | User
}

export async function syncServicePlanSubscription(args: SyncServicePlanArgs) {
  const { account, payload, plan, user } = args
  const stripe = getStripeOrThrow()
  const customerUser = await resolveCustomerUser({
    payload,
    user: plan.customerUser,
  })
  await ensureStripeCustomer({
    account,
    payload,
    user: customerUser || user,
  })

  if (!plan.stripeSubscriptionID?.trim()) {
    return null
  }

  const subscription = await stripe.subscriptions.retrieve(plan.stripeSubscriptionID.trim())

  const reconciledPlan = await reconcileStripeSubscription({
    payload,
    servicePlan: plan,
    subscription,
  })

  await createBillingEvent({
    accountId: account.id,
    actorId: user?.id,
    customerUserId:
      typeof plan.customerUser === 'number' || typeof plan.customerUser === 'string'
        ? plan.customerUser
        : plan.customerUser?.id,
    eventLabel: `Synced subscription for ${plan.title}`,
    eventType: 'subscription_synced',
    payload,
    processedAt: new Date().toISOString(),
    servicePlanId: plan.id,
    sourceSystem: 'internal',
    stripeObjectID: subscription.id,
  })

  return reconciledPlan
}

export async function createOrSyncServicePlanSubscription(args: SyncServicePlanArgs) {
  const { account, payload, plan, user } = args

  if (!['autopay_subscription', 'subscription_send_invoice'].includes(plan.billingMode || '')) {
    throw new Error('This service plan is not configured for Stripe subscription billing.')
  }

  const stripe = getStripeOrThrow()
  const customerUser = await resolveCustomerUser({
    payload,
    user: plan.customerUser,
  })
  const customerId = await ensureStripeCustomer({
    account,
    payload,
    user: customerUser || user,
  })

  if (plan.stripeSubscriptionID?.trim()) {
    return syncServicePlanSubscription(args)
  }

  const product = await stripe.products.create({
    metadata: {
      accountId: String(account.id),
      internalServicePlanId: String(plan.id),
    },
    name: plan.title,
  })

  const subscription = await stripe.subscriptions.create({
    collection_method: plan.collectionMethod || 'charge_automatically',
    customer: customerId,
    days_until_due:
      (plan.collectionMethod || 'charge_automatically') === 'send_invoice'
        ? plan.billingTermsDays || undefined
        : undefined,
    items: [
      {
        price_data: {
          currency: 'usd',
          product: product.id,
          recurring: {
            interval: 'month',
          },
          unit_amount: Math.round((plan.installmentAmount || 0) * 100),
        },
      },
    ],
    metadata: {
      accountId: String(account.id),
      internalServicePlanId: String(plan.id),
    },
  })

  const reconciledPlan = await reconcileStripeSubscription({
    payload,
    servicePlan: plan,
    subscription,
  })

  await createBillingEvent({
    accountId: account.id,
    actorId: user?.id,
    amount: plan.installmentAmount || 0,
    customerUserId:
      typeof plan.customerUser === 'number' || typeof plan.customerUser === 'string'
        ? plan.customerUser
        : plan.customerUser?.id,
    eventLabel: `Created subscription for ${plan.title}`,
    eventType: 'subscription_synced',
    payload,
    processedAt: new Date().toISOString(),
    servicePlanId: plan.id,
    sourceSystem: 'internal',
    stripeObjectID: subscription.id,
  })

  return reconciledPlan
}
