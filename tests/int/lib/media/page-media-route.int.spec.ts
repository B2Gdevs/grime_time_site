import { beforeEach, describe, expect, it, vi } from 'vitest'

const createLocalReq = vi.fn()
const getCurrentAuthContext = vi.fn()
const isLocalDevtoolsRequestHeaders = vi.fn()

vi.mock('payload', () => ({
  createLocalReq,
}))

vi.mock('@/lib/auth/getAuthContext', () => ({
  getCurrentAuthContext,
}))

vi.mock('@/lib/auth/localDevtools', () => ({
  isLocalDevtoolsRequestHeaders,
}))

function makeUpload(name: string, body: string) {
  const file = new File([body], name, { type: 'image/jpeg' })
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => new TextEncoder().encode(body).buffer,
  })
  return file
}

describe('internal page media devtools route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createLocalReq.mockResolvedValue({})
    isLocalDevtoolsRequestHeaders.mockReturnValue(true)
  })

  it('returns 401 when local admin devtools are not allowed', async () => {
    isLocalDevtoolsRequestHeaders.mockReturnValue(false)
    getCurrentAuthContext.mockResolvedValue({
      isRealAdmin: true,
      realUser: { email: 'owner@grimetime.app', id: 1, roles: ['admin'] },
    })

    const { POST } = await import('@/app/api/internal/dev/page-media/route')
    const formData = new FormData()
    formData.set('action', 'replace-existing')
    formData.set('mediaId', '9')
    formData.set('file', makeUpload('hero.jpg', 'test'))

    const response = await POST({
      formData: async () => formData,
      headers: new Headers({ host: 'localhost' }),
    } as unknown as Request)

    expect(response.status).toBe(401)
  })

  it('replaces an existing media record in place', async () => {
    const payload = {
      update: vi.fn().mockResolvedValue({ id: 14 }),
    }

    getCurrentAuthContext.mockResolvedValue({
      isRealAdmin: true,
      payload,
      realUser: { email: 'owner@grimetime.app', id: 1, roles: ['admin'] },
    })

    const { POST } = await import('@/app/api/internal/dev/page-media/route')
    const formData = new FormData()
    formData.set('action', 'replace-existing')
    formData.set('mediaId', '14')
    formData.set('alt', 'Updated alt')
    formData.set('file', makeUpload('hero.jpg', 'updated'))

    const response = await POST({
      formData: async () => formData,
      headers: new Headers({ host: 'localhost' }),
    } as unknown as Request)

    expect(response.status).toBe(200)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'media',
        data: { alt: 'Updated alt' },
        id: 14,
      }),
    )
  })

  it('creates a new media record and swaps the page relation', async () => {
    const payload = {
      create: vi.fn().mockResolvedValue({ id: 88 }),
      findByID: vi.fn().mockResolvedValue({
        hero: {
          media: 11,
          type: 'highImpact',
        },
        id: 7,
        layout: [],
      }),
      update: vi.fn().mockResolvedValue({ id: 7 }),
    }

    getCurrentAuthContext.mockResolvedValue({
      isRealAdmin: true,
      payload,
      realUser: { email: 'owner@grimetime.app', id: 1, roles: ['admin'] },
    })

    const { POST } = await import('@/app/api/internal/dev/page-media/route')
    const formData = new FormData()
    formData.set('action', 'create-and-swap')
    formData.set('pageId', '7')
    formData.set('relationPath', 'hero.media')
    formData.set('alt', 'Fresh hero')
    formData.set('file', makeUpload('fresh-hero.jpg', 'new-file'))

    const response = await POST({
      formData: async () => formData,
      headers: new Headers({ host: 'localhost' }),
    } as unknown as Request)

    expect(response.status).toBe(200)
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'media',
        data: { alt: 'Fresh hero' },
      }),
    )
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        data: {
          hero: {
            media: 88,
            type: 'highImpact',
          },
        },
        id: 7,
      }),
    )
  })
})
