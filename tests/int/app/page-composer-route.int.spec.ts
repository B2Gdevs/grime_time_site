import { beforeEach, describe, expect, it, vi } from 'vitest'

const createLocalReq = vi.fn()
const getCurrentAuthContext = vi.fn()
const hasContentAuthoringAccess = vi.fn()

vi.mock('payload', () => ({
  createLocalReq,
}))

vi.mock('@/lib/auth/getAuthContext', () => ({
  getCurrentAuthContext,
}))

vi.mock('@/lib/auth/organizationAccess', () => ({
  hasContentAuthoringAccess,
}))

describe('internal page composer route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createLocalReq.mockResolvedValue({})
  })

  it('rejects users without content authoring access', async () => {
    getCurrentAuthContext.mockResolvedValue({
      payload: {},
      realUser: { email: 'viewer@example.com', id: 31, roles: ['customer'] },
    })
    hasContentAuthoringAccess.mockResolvedValue(false)

    const { GET } = await import('@/app/api/internal/page-composer/route')
    const response = await GET(
      new Request('http://localhost:5465/api/internal/page-composer?pageId=7'),
    )

    expect(response.status).toBe(401)
  })

  it('allows a content author to load composer data without admin payload access', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            _status: 'draft',
            id: 7,
            pagePath: '/spring-refresh',
            publishedAt: null,
            slug: 'spring-refresh',
            title: 'Spring Refresh',
            updatedAt: '2026-04-03T12:00:00.000Z',
            visibility: 'private',
          },
        ],
      }),
      findByID: vi.fn().mockResolvedValue({
        _status: 'draft',
        hero: { type: 'lowImpact' },
        id: 7,
        layout: [],
        publishedAt: null,
        slug: 'spring-refresh',
        title: 'Spring Refresh',
        updatedAt: '2026-04-03T12:00:00.000Z',
        visibility: 'private',
      }),
    }

    getCurrentAuthContext.mockResolvedValue({
      payload,
      realUser: { email: 'designer@example.com', id: 32, roles: ['customer'] },
    })
    hasContentAuthoringAccess.mockResolvedValue(true)

    const { GET } = await import('@/app/api/internal/page-composer/route')
    const response = await GET(
      new Request('http://localhost:5465/api/internal/page-composer?pageId=7'),
    )

    expect(response.status).toBe(200)
    expect(hasContentAuthoringAccess).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({ email: 'designer@example.com' }),
    )
    expect(payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        id: 7,
        overrideAccess: false,
      }),
    )
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      page: {
        id: 7,
        pagePath: '/spring-refresh',
        slug: 'spring-refresh',
        title: 'Spring Refresh',
        visibility: 'private',
      },
    })
  })
})
