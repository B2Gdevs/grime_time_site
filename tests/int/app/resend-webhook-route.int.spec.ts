import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPayload = vi.fn()
const handleResendInboundEmailEvent = vi.fn()
const resendVerify = vi.fn()

vi.mock('payload', () => ({
  getPayload,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('resend', () => ({
  Resend: class Resend {
    webhooks = {
      verify: resendVerify,
    }
  },
}))

vi.mock('@/lib/media/resendInboundMedia', () => ({
  handleResendInboundEmailEvent,
}))

describe('resend webhook route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 're_test'
    process.env.RESEND_WEBHOOK_SECRET = 'whsec_test'
  })

  it('rejects requests when the Resend webhook secret is not configured', async () => {
    delete process.env.RESEND_WEBHOOK_SECRET

    const { POST } = await import('@/app/api/resend/webhook/route')
    const response = await POST(new Request('http://localhost/api/resend/webhook', { method: 'POST' }))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Resend webhook secret is not configured.',
    })
  })

  it('verifies the webhook and forwards the event into the inbound media service', async () => {
    const payload = { id: 'payload' }
    const event = {
      data: {
        attachments: [],
        bcc: [],
        cc: [],
        created_at: '2026-04-11T22:00:00.000Z',
        email_id: 'email_123',
        from: 'Crew <crew@example.com>',
        message_id: '<msg_123>',
        subject: 'Front gate photos',
        to: ['media@grimetime.app'],
      },
      type: 'email.received',
    }

    resendVerify.mockReturnValue(event)
    getPayload.mockResolvedValue(payload)
    handleResendInboundEmailEvent.mockResolvedValue({
      createdMediaCount: 2,
      duplicate: false,
      handled: true,
      ingestionId: '17',
      status: 'ingested',
    })

    const { POST } = await import('@/app/api/resend/webhook/route')
    const request = new Request('http://localhost/api/resend/webhook', {
      body: JSON.stringify({ test: true }),
      headers: {
        'Content-Type': 'application/json',
        'svix-id': 'evt_123',
        'svix-signature': 'sig_123',
        'svix-timestamp': '1712620800',
      },
      method: 'POST',
    })
    const response = await POST(request)

    expect(resendVerify).toHaveBeenCalledWith({
      headers: {
        id: 'evt_123',
        signature: 'sig_123',
        timestamp: '1712620800',
      },
      payload: JSON.stringify({ test: true }),
      webhookSecret: 'whsec_test',
    })
    expect(handleResendInboundEmailEvent).toHaveBeenCalledWith({
      event,
      payload,
      providerEventID: 'evt_123',
      resend: expect.any(Object),
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      createdMediaCount: 2,
      duplicate: false,
      handled: true,
      ingestionId: '17',
      received: true,
      status: 'ingested',
      type: 'email.received',
    })
  })
})
