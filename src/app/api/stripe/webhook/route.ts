import config from '@payload-config'
import { getPayload } from 'payload'

import { getStripeOrThrow } from '@/lib/billing/stripe/client'
import { handleStripeWebhookEvent } from '@/lib/billing/stripe/webhooks'

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()

  if (!webhookSecret) {
    return Response.json({ error: 'Stripe webhook secret is not configured.' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return Response.json({ error: 'Missing Stripe signature header.' }, { status: 400 })
  }

  const stripe = getStripeOrThrow()
  const body = await request.text()

  let event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Invalid Stripe webhook signature.' },
      { status: 400 },
    )
  }

  const payload = await getPayload({ config })
  const result = await handleStripeWebhookEvent({
    event,
    payload,
  })

  return Response.json({
    duplicate: result.duplicate,
    received: true,
  })
}
