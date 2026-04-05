import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSharedSectionStructureFromCategory } from '@/lib/pages/sharedSectionPageBridge'

const getCurrentAuthContext = vi.fn()
const resolveSharedSectionPermissions = vi.fn()
const loadSharedSectionsLibrary = vi.fn()
const createSharedSectionDraft = vi.fn()
const saveSharedSectionDraft = vi.fn()
const publishSharedSection = vi.fn()

vi.mock('@/lib/auth/getAuthContext', () => ({
  getCurrentAuthContext,
}))

vi.mock('@/lib/auth/sharedSectionPermissions', () => ({
  resolveSharedSectionPermissions,
}))

vi.mock('@/lib/pages/sharedSectionLibrary', () => ({
  createSharedSectionDraft,
  loadSharedSectionsLibrary,
  publishSharedSection,
  saveSharedSectionDraft,
}))

describe('internal shared sections route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects users without shared-section library access', async () => {
    getCurrentAuthContext.mockResolvedValue({
      payload: {},
      realUser: { email: 'viewer@example.com', id: 31, roles: ['customer'] },
    })
    resolveSharedSectionPermissions.mockResolvedValue({
      canCreate: false,
      canEditDraft: false,
      canInsertIntoPage: false,
      canPublish: false,
      canRestoreVersion: false,
      canViewLibrary: false,
    })

    const { GET } = await import('@/app/api/internal/shared-sections/route')
    const response = await GET(new Request('http://localhost:5465/api/internal/shared-sections'))

    expect(response.status).toBe(401)
  })

  it('returns shared-section library items for authorized users', async () => {
    const permissions = {
      canCreate: true,
      canEditDraft: true,
      canInsertIntoPage: true,
      canPublish: false,
      canRestoreVersion: false,
      canViewLibrary: true,
    }

    getCurrentAuthContext.mockResolvedValue({
      payload: {},
      realUser: { email: 'designer@example.com', id: 32, roles: ['customer'] },
    })
    resolveSharedSectionPermissions.mockResolvedValue(permissions)
    loadSharedSectionsLibrary.mockResolvedValue({
      items: [
        {
          category: 'hero',
          createdAt: '2026-04-05T00:00:00.000Z',
          currentVersion: 1,
          description: 'Primary homepage hero',
          id: 7,
          name: 'Homepage Hero',
          preview: { status: 'ready', updatedAt: '2026-04-05T00:00:00.000Z', url: '/hero.png' },
          publishedAt: null,
          slug: 'homepage-hero',
          status: 'draft',
          structure: { children: [], id: 'section-1', kind: 'section', layout: 'hero', props: {} },
          tags: ['residential'],
          updatedAt: '2026-04-05T00:00:00.000Z',
          usageCount: 0,
        },
      ],
      permissions,
    })

    const { GET } = await import('@/app/api/internal/shared-sections/route')
    const response = await GET(
      new Request('http://localhost:5465/api/internal/shared-sections?category=hero&search=home'),
    )

    expect(response.status).toBe(200)
    expect(loadSharedSectionsLibrary).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'hero',
        search: 'home',
      }),
    )
    await expect(response.json()).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 7, name: 'Homepage Hero' })],
      permissions,
    })
  })

  it('creates a shared-section draft for authorized users', async () => {
    const permissions = {
      canCreate: true,
      canEditDraft: true,
      canInsertIntoPage: true,
      canPublish: false,
      canRestoreVersion: false,
      canViewLibrary: true,
    }

    getCurrentAuthContext.mockResolvedValue({
      payload: {},
      realUser: { email: 'designer@example.com', id: 32, roles: ['customer'] },
    })
    resolveSharedSectionPermissions.mockResolvedValue(permissions)
    createSharedSectionDraft.mockResolvedValue({
      category: 'cta',
      createdAt: '2026-04-05T00:00:00.000Z',
      currentVersion: 1,
      description: null,
      id: 11,
      name: 'Quote CTA',
      preview: { status: 'pending', updatedAt: null, url: null },
      publishedAt: null,
      slug: 'quote-cta',
      status: 'draft',
      structure: { children: [], id: 'section-2', kind: 'section', layout: 'cta-band', props: {} },
      tags: ['quote'],
      updatedAt: '2026-04-05T00:00:00.000Z',
      usageCount: 0,
    })

    const { POST } = await import('@/app/api/internal/shared-sections/route')
    const response = await POST(
      new Request('http://localhost:5465/api/internal/shared-sections', {
        body: JSON.stringify({
          action: 'create-shared-section',
          category: 'cta',
          name: 'Quote CTA',
          structure: createSharedSectionStructureFromCategory('cta'),
          tags: ['quote'],
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(200)
    expect(createSharedSectionDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: 'cta',
          name: 'Quote CTA',
          tags: ['quote'],
        }),
      }),
    )
    await expect(response.json()).resolves.toMatchObject({
      item: expect.objectContaining({ id: 11, slug: 'quote-cta' }),
      permissions,
    })
  })

  it('blocks create attempts from users without create permission', async () => {
    const permissions = {
      canCreate: false,
      canEditDraft: true,
      canInsertIntoPage: true,
      canPublish: false,
      canRestoreVersion: false,
      canViewLibrary: true,
    }

    getCurrentAuthContext.mockResolvedValue({
      payload: {},
      realUser: { email: 'viewer@example.com', id: 48, roles: ['customer'] },
    })
    resolveSharedSectionPermissions.mockResolvedValue(permissions)

    const { POST } = await import('@/app/api/internal/shared-sections/route')
    const response = await POST(
      new Request('http://localhost:5465/api/internal/shared-sections', {
        body: JSON.stringify({
          action: 'create-shared-section',
          category: 'cta',
          name: 'Quote CTA',
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(403)
    expect(createSharedSectionDraft).not.toHaveBeenCalled()
  })

  it('blocks draft saves from users without draft-edit permission', async () => {
    const permissions = {
      canCreate: true,
      canEditDraft: false,
      canInsertIntoPage: true,
      canPublish: false,
      canRestoreVersion: false,
      canViewLibrary: true,
    }

    getCurrentAuthContext.mockResolvedValue({
      payload: {},
      realUser: { email: 'viewer@example.com', id: 49, roles: ['customer'] },
    })
    resolveSharedSectionPermissions.mockResolvedValue(permissions)

    const { POST } = await import('@/app/api/internal/shared-sections/route')
    const response = await POST(
      new Request('http://localhost:5465/api/internal/shared-sections', {
        body: JSON.stringify({
          action: 'save-draft',
          id: 11,
          name: 'Quote CTA',
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(403)
    expect(saveSharedSectionDraft).not.toHaveBeenCalled()
  })

  it('blocks publish attempts from users without publish permission', async () => {
    const permissions = {
      canCreate: true,
      canEditDraft: true,
      canInsertIntoPage: true,
      canPublish: false,
      canRestoreVersion: false,
      canViewLibrary: true,
    }

    getCurrentAuthContext.mockResolvedValue({
      payload: {},
      realUser: { email: 'designer@example.com', id: 32, roles: ['customer'] },
    })
    resolveSharedSectionPermissions.mockResolvedValue(permissions)

    const { POST } = await import('@/app/api/internal/shared-sections/route')
    const response = await POST(
      new Request('http://localhost:5465/api/internal/shared-sections', {
        body: JSON.stringify({
          action: 'publish-shared-section',
          id: 11,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(403)
    expect(publishSharedSection).not.toHaveBeenCalled()
  })
})
