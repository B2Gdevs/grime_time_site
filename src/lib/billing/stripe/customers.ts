import type { Payload } from 'payload'

import { getStripeOrThrow } from './client'
import type { Account, User } from '@/payload-types'

type EnsureStripeCustomerArgs = {
  account: Account
  payload: Payload
  user?: null | User
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
  const { account, payload, user } = args
  const stripe = getStripeOrThrow()

  if (account.stripeCustomerID?.trim()) {
    return account.stripeCustomerID.trim()
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
