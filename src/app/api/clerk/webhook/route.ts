import config from '@payload-config'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { getPayload } from 'payload'

import { handleClerkWebhookEvent } from '@/lib/auth/clerkWebhookSync'

export async function POST(request: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim()

  if (!signingSecret) {
    return Response.json({ error: 'Clerk webhook signing secret is not configured.' }, { status: 503 })
  }

  let event

  try {
    event = await verifyWebhook(request as Parameters<typeof verifyWebhook>[0], { signingSecret })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Invalid Clerk webhook signature.' },
      { status: 400 },
    )
  }

  const payload = await getPayload({ config })
  const result = await handleClerkWebhookEvent({
    event,
    payload,
  })

  return Response.json({
    handled: result.handled,
    received: true,
    scope: result.scope,
    summary: result.summary,
    type: event.type,
  })
}
