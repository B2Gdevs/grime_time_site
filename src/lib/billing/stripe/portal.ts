import { getServerSideURL } from '@/utilities/getURL'
import { createBillingEvent } from '@/lib/billing/events'
import { getStripeOrThrow } from './client'
import { ensureStripeCustomer } from './customers'
import type { Account, User } from '@/payload-types'
import type { Payload } from 'payload'

export async function createStripePortalSession(args: {
  account: Account
  payload: Payload
  returnPath?: string
  user?: null | User
}) {
  const { account, payload, returnPath = '/account', user } = args
  const stripe = getStripeOrThrow()
  const customerId = await ensureStripeCustomer({
    account,
    payload,
    user,
  })

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getServerSideURL()}${returnPath}`,
  })

  await payload.update({
    collection: 'accounts',
    id: account.id,
    data: {
      billingPortalLastSharedAt: new Date().toISOString(),
      stripeCustomerID: customerId,
    },
  })

  await createBillingEvent({
    accountId: account.id,
    actorId: user?.id,
    customerUserId: user?.id,
    eventLabel: `Created Stripe billing portal session for ${account.name}`,
    eventType: 'portal_session_created',
    payload,
    processedAt: new Date().toISOString(),
    sourceSystem: 'internal',
    stripeObjectID: customerId,
  })

  return session.url
}
