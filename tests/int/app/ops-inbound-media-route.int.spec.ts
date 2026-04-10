import { beforeEach, describe, expect, it, vi } from 'vitest'

const requirePayloadUser = vi.fn()
const userIsAdmin = vi.fn()
const loadInboundMediaIngestionWorkspace = vi.fn()

vi.mock('@/lib/auth/requirePayloadUser', () => ({
  requirePayloadUser,
}))

vi.mock('@/lib/auth/getCurrentPayloadUser', () => ({
  userIsAdmin,
}))

vi.mock('@/lib/media/inboundMediaIngestionWorkspace', () => ({
  loadInboundMediaIngestionWorkspace,
}))

describe('ops inbound media route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated or non-admin callers', async () => {
    requirePayloadUser.mockResolvedValue(null)

    const { GET } = await import('@/app/api/internal/ops/inbound-media/route')
    const response = await GET(new Request('http://localhost/api/internal/ops/inbound-media'))

    expect(response.status).toBe(401)
    expect(loadInboundMediaIngestionWorkspace).not.toHaveBeenCalled()
  })

  it('loads filtered ingestion records for an admin', async () => {
    const payload = {}
    const user = { id: 7 }

    requirePayloadUser.mockResolvedValue({
      payload,
      user,
    })
    userIsAdmin.mockReturnValue(true)
    loadInboundMediaIngestionWorkspace.mockResolvedValue([
      {
        acceptedAttachmentCount: 2,
        createdMediaCount: 1,
        id: '12',
        ingestionLabel: 'Resend inbound media from crew@example.com: Front gate photos',
        provider: 'resend',
        receivedAt: '2026-04-10T12:00:00.000Z',
        replayCount: 0,
        senderEmail: 'crew@example.com',
        status: 'received',
        subject: 'Front gate photos',
        totalAttachmentCount: 2,
      },
    ])

    const { GET } = await import('@/app/api/internal/ops/inbound-media/route')
    const response = await GET(
      new Request('http://localhost/api/internal/ops/inbound-media?status=received&q=crew'),
    )

    expect(response.status).toBe(200)
    expect(loadInboundMediaIngestionWorkspace).toHaveBeenCalledWith({
      payload,
      searchQuery: 'crew',
      status: 'received',
      user,
    })
    await expect(response.json()).resolves.toEqual({
      items: [
        {
          acceptedAttachmentCount: 2,
          createdMediaCount: 1,
          id: '12',
          ingestionLabel: 'Resend inbound media from crew@example.com: Front gate photos',
          provider: 'resend',
          receivedAt: '2026-04-10T12:00:00.000Z',
          replayCount: 0,
          senderEmail: 'crew@example.com',
          status: 'received',
          subject: 'Front gate photos',
          totalAttachmentCount: 2,
        },
      ],
    })
  })
})

