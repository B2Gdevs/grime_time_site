import { beforeEach, describe, expect, it, vi } from 'vitest'

const createLocalReq = vi.fn()

vi.mock('payload', async () => {
  const actual = await vi.importActual<typeof import('payload')>('payload')

  return {
    ...actual,
    createLocalReq,
  }
})

describe('resend inbound media ingestion', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    createLocalReq.mockResolvedValue({})
    vi.stubGlobal('fetch', fetchMock)
  })

  it('creates media for accepted attachments and marks mixed deliveries partial', async () => {
    const { handleResendInboundEmailEvent } = await import('@/lib/media/resendInboundMedia')
    const createdDocs: Array<{ collection: string; data: Record<string, unknown> }> = []
    const updatedDocs: Array<{ data: Record<string, unknown>; id: number | string }> = []
    const payload = {
      create: vi
        .fn()
        .mockImplementationOnce(async ({ data }: { data: Record<string, unknown> }) => ({
          id: 41,
          ...data,
        }))
        .mockImplementationOnce(async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
          createdDocs.push({ collection, data })
          return { id: 91, ...data }
        }),
      find: vi.fn().mockResolvedValue({ docs: [] }),
      logger: {
        error: vi.fn(),
      },
      update: vi.fn().mockImplementation(async ({ data, id }: { data: Record<string, unknown>; id: number | string }) => {
        updatedDocs.push({ data, id })
        return { id, ...data }
      }),
    }
    const resend = {
      emails: {
        receiving: {
          attachments: {
            list: vi.fn().mockResolvedValue({
              data: {
                data: [
                  {
                    content_disposition: 'attachment',
                    content_id: null,
                    content_type: 'image/jpeg',
                    download_url: 'https://example.com/front.jpg',
                    expires_at: '2026-04-11T23:00:00.000Z',
                    filename: 'front.jpg',
                    id: 'att_1',
                    size: 40_000,
                  },
                  {
                    content_disposition: 'attachment',
                    content_id: null,
                    content_type: 'application/pdf',
                    download_url: 'https://example.com/scope.pdf',
                    expires_at: '2026-04-11T23:00:00.000Z',
                    filename: 'scope.pdf',
                    id: 'att_2',
                    size: 22_000,
                  },
                ],
                has_more: false,
                object: 'list',
              },
              error: null,
            }),
          },
        },
      },
    }

    fetchMock.mockResolvedValue({
      arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer,
      ok: true,
    })

    const result = await handleResendInboundEmailEvent({
      event: {
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
      },
      payload: payload as never,
      providerEventID: 'evt_123',
      resend: resend as never,
    })

    expect(result).toEqual({
      createdMediaCount: 1,
      duplicate: false,
      handled: true,
      ingestionId: '41',
      status: 'partial',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(createdDocs).toEqual([
      {
        collection: 'media',
        data: {
          alt: 'Front gate photos',
        },
      },
    ])
    expect(updatedDocs.at(-1)).toMatchObject({
      data: {
        createdMediaIDs: ['91'],
        status: 'partial',
      },
      id: 41,
    })
  }, 15000)

  it('treats completed ingestions with the same idempotency key as duplicates', async () => {
    const { handleResendInboundEmailEvent } = await import('@/lib/media/resendInboundMedia')
    const payload = {
      create: vi.fn(),
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            id: 55,
            status: 'ingested',
          },
        ],
      }),
      logger: {
        error: vi.fn(),
      },
      update: vi.fn(),
    }

    const result = await handleResendInboundEmailEvent({
      event: {
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
      },
      payload: payload as never,
      providerEventID: 'evt_123',
      resend: {} as never,
    })

    expect(result).toEqual({
      createdMediaCount: 0,
      duplicate: true,
      handled: true,
      ingestionId: '55',
      status: 'ingested',
    })
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })
})
