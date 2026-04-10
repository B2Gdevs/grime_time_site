import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPayload = vi.fn()
const handleClerkWebhookEvent = vi.fn()
const verifyWebhook = vi.fn()

vi.mock('payload', () => ({
  getPayload,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('@clerk/nextjs/webhooks', () => ({
  verifyWebhook,
}))

vi.mock('@/lib/auth/clerkWebhookSync', () => ({
  handleClerkWebhookEvent,
}))

describe('clerk webhook route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.CLERK_WEBHOOK_SIGNING_SECRET = 'whsec_test'
  })

  it('rejects requests when the Clerk webhook secret is not configured', async () => {
    delete process.env.CLERK_WEBHOOK_SIGNING_SECRET

    const { POST } = await import('@/app/api/clerk/webhook/route')
    const response = await POST(new Request('http://localhost/api/clerk/webhook', { method: 'POST' }))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Clerk webhook signing secret is not configured.',
    })
  })

  it('verifies the webhook and forwards the event into the app-owned reconciliation handler', async () => {
    const payload = { id: 'payload' }
    const event = {
      data: {
        id: 'user_123',
      },
      event_attributes: {
        http_request: {
          client_ip: '127.0.0.1',
          user_agent: 'vitest',
        },
      },
      object: 'event',
      type: 'user.updated',
    }

    verifyWebhook.mockResolvedValue(event)
    getPayload.mockResolvedValue(payload)
    handleClerkWebhookEvent.mockResolvedValue({
      handled: true,
      scope: 'user',
      summary: 'Synced Clerk user operator@grimetime.app.',
    })

    const { POST } = await import('@/app/api/clerk/webhook/route')
    const request = new Request('http://localhost/api/clerk/webhook', {
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

    expect(verifyWebhook).toHaveBeenCalledWith(request, {
      signingSecret: 'whsec_test',
    })
    expect(handleClerkWebhookEvent).toHaveBeenCalledWith({
      event,
      payload,
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      handled: true,
      received: true,
      scope: 'user',
      summary: 'Synced Clerk user operator@grimetime.app.',
      type: 'user.updated',
    })
  })
})
