import type { Payload } from 'payload'

import { getStripeOrThrow } from './client'
import type { Account, User } from '@/payload-types'

type EnsureStripeCustomerArgs = {
  account: Account
  ignoreAccountCustomerID?: boolean
  payload: Payload
  user?: null | User
}

type StripeCustomerCarrier = {
  stripeCustomerID?: null | string
}

function addressGroupToStripeAddress(address: Account['billingAddress'] | Account['serviceAddress'] | User['billingAddress'] | User['serviceAddress']) {
  if (!address?.street1 && !address?.city && !address?.postalCode) {
    return undefined
  }

  return {
    city: address?.city || undefined,
    country: 'US',
    line1: address?.street1 || undefined,
    line2: address?.street2 || undefined,
    postal_code: address?.postalCode || undefined,
    state: address?.state || undefined,
  }
}

export async function ensureStripeCustomer(args: EnsureStripeCustomerArgs) {
  const { account, ignoreAccountCustomerID, payload, user } = args
  const stripe = getStripeOrThrow()
  const existingCustomerID =
    (ignoreAccountCustomerID ? null : account.stripeCustomerID?.trim()) ||
    (await findLinkedStripeCustomerID(payload, account.id))

  if (existingCustomerID) {
    if (existingCustomerID !== account.stripeCustomerID?.trim()) {
      await payload.update({
        collection: 'accounts',
        id: account.id,
        data: {
          stripeCustomerID: existingCustomerID,
        },
      })
    }

    return existingCustomerID
  }

  const customer = await stripe.customers.create({
    address:
      addressGroupToStripeAddress(account.billingAddress) ||
      addressGroupToStripeAddress(account.serviceAddress) ||
      addressGroupToStripeAddress(user?.billingAddress) ||
      addressGroupToStripeAddress(user?.serviceAddress),
    email: account.billingEmail || user?.email || undefined,
    metadata: {
      accountId: String(account.id),
      accountType: account.accountType || 'residential',
    },
    name: account.legalName || account.name || user?.name || undefined,
    phone: user?.phone || account.accountsPayablePhone || undefined,
  })

  await payload.update({
    collection: 'accounts',
    id: account.id,
    data: {
      stripeCustomerID: customer.id,
      stripeDefaultPaymentMethodID:
        typeof customer.invoice_settings.default_payment_method === 'string'
          ? customer.invoice_settings.default_payment_method
          : undefined,
    },
  })

  return customer.id
}

async function findLinkedStripeCustomerID(
  payload: Payload,
  accountID: number | string,
): Promise<null | string> {
  for (const collection of ['invoices', 'service-plans'] as const) {
    const result = await payload.find({
      collection,
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      sort: '-updatedAt',
      where: {
        account: {
          equals: accountID,
        },
      },
    })

    const customerID = (result.docs as StripeCustomerCarrier[])
      .map((doc) => doc.stripeCustomerID?.trim())
      .find((value): value is string => Boolean(value))

    if (customerID) {
      return customerID
    }
  }

  return null
}
