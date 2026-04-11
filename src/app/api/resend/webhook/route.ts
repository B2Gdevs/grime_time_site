import config from '@payload-config'
import { getPayload } from 'payload'
import { Resend } from 'resend'

import { handleResendInboundEmailEvent } from '@/lib/media/resendInboundMedia'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim()

  if (!webhookSecret) {
    return Response.json({ error: 'Resend webhook secret is not configured.' }, { status: 503 })
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()

  if (!apiKey) {
    return Response.json({ error: 'Resend API key is not configured.' }, { status: 503 })
  }

  const resend = new Resend(apiKey)
  const body = await request.text()
  const webhookHeaders = {
    id: request.headers.get('svix-id')?.trim() || '',
    signature: request.headers.get('svix-signature')?.trim() || '',
    timestamp: request.headers.get('svix-timestamp')?.trim() || '',
  }
  let event

  if (!webhookHeaders.id || !webhookHeaders.signature || !webhookHeaders.timestamp) {
    return Response.json({ error: 'Missing Resend webhook signature headers.' }, { status: 400 })
  }

  try {
    event = resend.webhooks.verify({
      headers: webhookHeaders,
      payload: body,
      webhookSecret,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Invalid Resend webhook signature.' },
      { status: 400 },
    )
  }

  const payload = await getPayload({ config })
  const result = await handleResendInboundEmailEvent({
    event,
    payload,
    providerEventID: request.headers.get('svix-id'),
    resend,
  })

  return Response.json({
    createdMediaCount: result.createdMediaCount,
    duplicate: result.duplicate,
    handled: result.handled,
    ingestionId: result.ingestionId,
    received: true,
    status: result.status,
    type: event.type,
  })
}
