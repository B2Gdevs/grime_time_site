import { beforeEach, describe, expect, it, vi } from 'vitest'

const requirePayloadUser = vi.fn()
const userIsAdmin = vi.fn()
const requestInboundMediaReplay = vi.fn()

vi.mock('@/lib/auth/requirePayloadUser', () => ({
  requirePayloadUser,
}))

vi.mock('@/lib/auth/getCurrentPayloadUser', () => ({
  userIsAdmin,
}))

vi.mock('@/lib/media/inboundMediaIngestionWorkspace', () => ({
  InboundMediaIngestionError: class InboundMediaIngestionError extends Error {
    status: number

    constructor(message: string, status = 400) {
      super(message)
      this.status = status
    }
  },
  requestInboundMediaReplay,
}))

describe('ops inbound media item route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects non-admin callers', async () => {
    requirePayloadUser.mockResolvedValue({
      user: { id: 7 },
    })
    userIsAdmin.mockReturnValue(false)

    const { POST } = await import('@/app/api/internal/ops/inbound-media/[id]/route')
    const response = await POST(
      new Request('http://localhost/api/internal/ops/inbound-media/9', {
        body: JSON.stringify({ action: 'request_replay' }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
      {
        params: Promise.resolve({ id: '9' }),
      },
    )

    expect(response.status).toBe(401)
    expect(requestInboundMediaReplay).not.toHaveBeenCalled()
  })

  it('passes replay requests into the app-owned workspace service', async () => {
    const payload = {}
    const user = { id: 7 }

    requirePayloadUser.mockResolvedValue({
      payload,
      user,
    })
    userIsAdmin.mockReturnValue(true)
    requestInboundMediaReplay.mockResolvedValue({
      acceptedAttachmentCount: 2,
      createdMediaCount: 0,
      id: '9',
      ingestionLabel: 'Resend inbound media from crew@example.com',
      provider: 'resend',
      receivedAt: '2026-04-10T12:00:00.000Z',
      replayCount: 1,
      senderEmail: 'crew@example.com',
      status: 'replay_requested',
      subject: null,
      totalAttachmentCount: 2,
    })

    const { POST } = await import('@/app/api/internal/ops/inbound-media/[id]/route')
    const response = await POST(
      new Request('http://localhost/api/internal/ops/inbound-media/9', {
        body: JSON.stringify({
          action: 'request_replay',
          notes: 'Retry after the attachment fetch worker is wired.',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
      {
        params: Promise.resolve({ id: '9' }),
      },
    )

    expect(response.status).toBe(200)
    expect(requestInboundMediaReplay).toHaveBeenCalledWith({
      id: 9,
      notes: 'Retry after the attachment fetch worker is wired.',
      payload,
      user,
    })
    await expect(response.json()).resolves.toEqual({
      item: {
        acceptedAttachmentCount: 2,
        createdMediaCount: 0,
        id: '9',
        ingestionLabel: 'Resend inbound media from crew@example.com',
        provider: 'resend',
        receivedAt: '2026-04-10T12:00:00.000Z',
        replayCount: 1,
        senderEmail: 'crew@example.com',
        status: 'replay_requested',
        subject: null,
        totalAttachmentCount: 2,
      },
    })
  })
})

