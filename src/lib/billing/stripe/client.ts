import Stripe from 'stripe'

let stripeClient: null | Stripe = null

export function getStripeOrThrow() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim()

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured.')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey)
  }

  return stripeClient
}
