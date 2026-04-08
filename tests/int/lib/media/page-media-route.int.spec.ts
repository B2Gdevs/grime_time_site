import { beforeEach, describe, expect, it, vi } from 'vitest'

const createLocalReq = vi.fn()
const getCurrentAuthContext = vi.fn()
const isLocalDevtoolsRequestHeaders = vi.fn()
const generateOpenAIImage = vi.fn()
const generateOpenAIVideo = vi.fn()

vi.mock('payload', () => ({
  createLocalReq,
}))

vi.mock('@/lib/auth/getAuthContext', () => ({
  getCurrentAuthContext,
}))

vi.mock('@/lib/auth/localDevtools', () => ({
  isLocalDevtoolsRequestHeaders,
}))

vi.mock('@/lib/media/openaiImageGeneration', () => ({
  generateOpenAIImage,
}))

vi.mock('@/lib/media/openaiVideoGeneration', () => ({
  generateOpenAIVideo,
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
    generateOpenAIImage.mockResolvedValue({
      buffer: Buffer.from('generated-image'),
      contentType: 'image/png',
      extension: 'png',
    })
    generateOpenAIVideo.mockResolvedValue({
      buffer: Buffer.from('generated-video'),
      contentType: 'video/mp4',
      extension: 'mp4',
    })
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

  it('lists recent media records for the local media library', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            alt: 'Driveway hero',
            filename: 'driveway-hero.jpg',
            id: 14,
            mimeType: 'image/jpeg',
            updatedAt: '2026-04-02T00:00:00.000Z',
            url: '/media/driveway-hero.jpg',
          },
        ],
      }),
    }

    getCurrentAuthContext.mockResolvedValue({
      isRealAdmin: true,
      payload,
      realUser: { email: 'owner@grimetime.app', id: 1, roles: ['admin'] },
    })

    const { GET } = await import('@/app/api/internal/dev/page-media/route')
    const response = await GET({
      headers: new Headers({ host: 'localhost' }),
    } as unknown as Request)

    expect(response.status).toBe(200)
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'media',
        limit: 48,
        sort: '-updatedAt',
      }),
    )
    await expect(response.json()).resolves.toEqual({
      items: [
        {
          alt: 'Driveway hero',
          filename: 'driveway-hero.jpg',
          id: 14,
          mimeType: 'image/jpeg',
          previewUrl: '/media/driveway-hero.jpg',
          updatedAt: '2026-04-02T00:00:00.000Z',
        },
      ],
    })
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
        slug: 'home',
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
          layout: [
            {
              blockType: 'heroBlock',
              media: 88,
              type: 'highImpact',
            },
            {
              blockType: 'serviceEstimator',
            },
          ],
        },
        id: 7,
      }),
    )
  })

  it('generates a new media record and swaps the page relation', async () => {
    const payload = {
      create: vi.fn().mockResolvedValue({ id: 109 }),
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
    formData.set('action', 'generate-and-swap')
    formData.set('pageId', '7')
    formData.set('relationPath', 'hero.media')
    formData.set('prompt', 'Fresh driveway photo in bright daylight')

    const response = await POST({
      formData: async () => formData,
      headers: new Headers({ host: 'localhost' }),
    } as unknown as Request)

    expect(response.status).toBe(200)
    expect(generateOpenAIImage).toHaveBeenCalled()
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'media',
        data: { alt: 'Fresh driveway photo in bright daylight' },
      }),
    )
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        id: 7,
      }),
    )
  })

  it('swaps a page slot to an existing media record', async () => {
    const payload = {
      findByID: vi
        .fn()
        .mockResolvedValueOnce({
          hero: {
            media: 11,
            type: 'highImpact',
          },
          id: 7,
          layout: [],
          slug: 'home',
        })
        .mockResolvedValueOnce({
          alt: 'Library replacement',
          filename: 'library-replacement.jpg',
          id: 21,
          updatedAt: '2026-04-02T00:00:00.000Z',
          url: '/media/library-replacement.jpg',
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
    formData.set('action', 'swap-existing-reference')
    formData.set('mediaId', '21')
    formData.set('pageId', '7')
    formData.set('relationPath', 'hero.media')

    const response = await POST({
      formData: async () => formData,
      headers: new Headers({ host: 'localhost' }),
    } as unknown as Request)

    expect(response.status).toBe(200)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        data: {
          hero: {
            media: 21,
            type: 'highImpact',
          },
          layout: [
            {
              blockType: 'heroBlock',
              media: 21,
              type: 'highImpact',
            },
            {
              blockType: 'serviceEstimator',
            },
          ],
        },
        id: 7,
      }),
    )
    await expect(response.json()).resolves.toMatchObject({
      media: {
        id: 21,
        mimeType: null,
        previewUrl: '/media/library-replacement.jpg',
      },
      mediaId: 21,
      ok: true,
      pageId: 7,
    })
  })

  it('generates a video media record when video kind is requested', async () => {
    const payload = {
      create: vi.fn().mockResolvedValue({ id: 301 }),
    }

    getCurrentAuthContext.mockResolvedValue({
      isRealAdmin: true,
      payload,
      realUser: { email: 'owner@grimetime.app', id: 1, roles: ['admin'] },
    })

    const { POST } = await import('@/app/api/internal/dev/page-media/route')
    const formData = new FormData()
    formData.set('action', 'generate-only')
    formData.set('mediaKind', 'video')
    formData.set('prompt', 'A short exterior cleaning promo clip with bright afternoon light')

    const response = await POST({
      formData: async () => formData,
      headers: new Headers({ host: 'localhost' }),
    } as unknown as Request)

    expect(response.status).toBe(200)
    expect(generateOpenAIVideo).toHaveBeenCalled()
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'media',
        file: expect.objectContaining({
          mimetype: 'video/mp4',
          name: expect.stringMatching(/\.mp4$/),
        }),
      }),
    )
  })

  it('uses an existing image media record as the source reference for generated video', async () => {
    const originalFetch = global.fetch
    global.fetch = vi.fn().mockResolvedValue({
      arrayBuffer: async () => new TextEncoder().encode('source-image').buffer,
      ok: true,
    }) as unknown as typeof fetch

    const payload = {
      create: vi.fn().mockResolvedValue({ id: 410 }),
      findByID: vi
        .fn()
        .mockResolvedValueOnce({
          filename: 'seed-grime-driveway.jpg',
          id: 21,
          mimeType: 'image/jpeg',
          url: '/media/seed-grime-driveway.jpg',
        })
        .mockResolvedValueOnce({
          hero: {
            media: 21,
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

    try {
      const { POST } = await import('@/app/api/internal/dev/page-media/route')
      const formData = new FormData()
      formData.set('action', 'generate-and-swap')
      formData.set('mediaKind', 'video')
      formData.set('pageId', '7')
      formData.set('relationPath', 'hero.media')
      formData.set('prompt', 'Turn this driveway still into a short cinematic cleaning clip')
      formData.set('sourceMediaId', '21')

      const response = await POST({
        formData: async () => formData,
        headers: new Headers({ host: 'localhost' }),
      } as unknown as Request)

      expect(response.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/media\/seed-grime-driveway\.jpg$/))
      expect(generateOpenAIVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          inputReference: expect.objectContaining({
            contentType: 'image/jpeg',
            data: expect.any(Buffer),
            filename: 'seed-grime-driveway.jpg',
          }),
          prompt: 'Turn this driveway still into a short cinematic cleaning clip',
        }),
      )
      expect(payload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'media',
          file: expect.objectContaining({
            mimetype: 'video/mp4',
          }),
        }),
      )
    } finally {
      global.fetch = originalFetch
    }
  })
})
