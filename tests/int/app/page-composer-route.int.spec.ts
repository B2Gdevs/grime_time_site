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
      isRealAdmin: false,
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
      isRealAdmin: false,
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

  it('allows a real admin to load composer data without content authoring membership', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            _status: 'published',
            id: 7,
            pagePath: '/',
            publishedAt: '2026-04-03T12:00:00.000Z',
            slug: 'home',
            title: 'Home',
            updatedAt: '2026-04-03T12:00:00.000Z',
            visibility: 'public',
          },
        ],
      }),
      findByID: vi.fn().mockResolvedValue({
        _status: 'published',
        hero: { type: 'highImpact' },
        id: 7,
        layout: [],
        publishedAt: '2026-04-03T12:00:00.000Z',
        slug: 'home',
        title: 'Home',
        updatedAt: '2026-04-03T12:00:00.000Z',
        visibility: 'public',
      }),
    }

    getCurrentAuthContext.mockResolvedValue({
      isRealAdmin: true,
      payload,
      realUser: { email: 'admin@example.com', id: 1, roles: ['admin'] },
    })
    hasContentAuthoringAccess.mockResolvedValue(false)

    const { GET } = await import('@/app/api/internal/page-composer/route')
    const response = await GET(
      new Request('http://localhost:5465/api/internal/page-composer?pageId=7'),
    )

    expect(response.status).toBe(200)
    expect(hasContentAuthoringAccess).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      page: {
        id: 7,
        pagePath: '/',
        slug: 'home',
        title: 'Home',
        visibility: 'public',
      },
    })
  })

  it('creates a private draft clone from an existing page', async () => {
    const payload = {
      create: vi.fn().mockResolvedValue({
        _status: 'draft',
        hero: { type: 'lowImpact' },
        id: 12,
        layout: [],
        publishedAt: null,
        slug: 'spring-refresh-draft',
        title: 'Spring Refresh Draft',
        updatedAt: '2026-04-03T12:30:00.000Z',
        visibility: 'private',
      }),
      find: vi
        .fn()
        .mockResolvedValueOnce({
          docs: [],
        })
        .mockResolvedValueOnce({
          docs: [
            {
              _status: 'draft',
              id: 7,
              publishedAt: null,
              slug: 'spring-refresh',
              title: 'Spring Refresh',
              updatedAt: '2026-04-03T12:00:00.000Z',
              visibility: 'private',
            },
            {
              _status: 'draft',
              id: 12,
              publishedAt: null,
              slug: 'spring-refresh-draft',
              title: 'Spring Refresh Draft',
              updatedAt: '2026-04-03T12:30:00.000Z',
              visibility: 'private',
            },
          ],
        }),
      findByID: vi.fn().mockResolvedValue({
        _status: 'draft',
        hero: { media: { id: 55 }, type: 'lowImpact' },
        id: 7,
        layout: [
          {
            blockType: 'serviceGrid',
            id: 'block-1',
            services: [
              {
                id: 'row-1',
                media: { id: 91 },
                name: 'House wash',
                summary: 'Exterior cleaning.',
              },
            ],
          },
        ],
        publishedAt: null,
        slug: 'spring-refresh',
        title: 'Spring Refresh',
        updatedAt: '2026-04-03T12:00:00.000Z',
        visibility: 'public',
      }),
    }

    getCurrentAuthContext.mockResolvedValue({
      isRealAdmin: false,
      payload,
      realUser: { email: 'designer@example.com', id: 32, roles: ['customer'] },
    })
    hasContentAuthoringAccess.mockResolvedValue(true)

    const { POST } = await import('@/app/api/internal/page-composer/route')
    const response = await POST(
      new Request('http://localhost:5465/api/internal/page-composer', {
        body: JSON.stringify({
          action: 'clone-page',
          sourcePageId: 7,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(200)
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        data: expect.objectContaining({
          hero: expect.objectContaining({
            media: 55,
          }),
          layout: expect.arrayContaining([
            expect.objectContaining({
              blockType: 'serviceGrid',
              services: expect.arrayContaining([
                expect.objectContaining({
                  media: 91,
                }),
              ]),
            }),
          ]),
          slug: 'spring-refresh-draft',
          title: 'Spring Refresh Draft',
          visibility: 'private',
        }),
      }),
    )
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      page: {
        id: 12,
        pagePath: '/spring-refresh-draft',
        slug: 'spring-refresh-draft',
        title: 'Spring Refresh Draft',
        visibility: 'private',
      },
    })
  })
})
