import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const isLocalDevtoolsRequestHeaders = vi.fn()

vi.mock('@/lib/auth/localDevtools', () => ({
  isLocalDevtoolsRequestHeaders,
}))

describe('loadLocalDevBypassUser', () => {
  const originalBypass = process.env.GT_DEV_AUTH_BYPASS
  const originalAdminEmail = process.env.ADMIN_EMAIL

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_EMAIL = 'bg@grimetime.app'
  })

  afterEach(() => {
    if (originalBypass === undefined) {
      delete process.env.GT_DEV_AUTH_BYPASS
    } else {
      process.env.GT_DEV_AUTH_BYPASS = originalBypass
    }

    if (originalAdminEmail === undefined) {
      delete process.env.ADMIN_EMAIL
    } else {
      process.env.ADMIN_EMAIL = originalAdminEmail
    }
  })

  it('does not resolve a localhost bypass user unless the bypass env is explicitly true', async () => {
    delete process.env.GT_DEV_AUTH_BYPASS
    isLocalDevtoolsRequestHeaders.mockReturnValue(true)

    const payload = {
      find: vi.fn(),
    }

    const { loadLocalDevBypassUser } = await import('@/lib/auth/localDevBypass')
    const result = await loadLocalDevBypassUser({
      payload: payload as never,
      requestHeaders: new Headers({ host: 'localhost:5465' }),
    })

    expect(result).toBeNull()
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('resolves the admin email only when the bypass env is explicitly true on localhost', async () => {
    process.env.GT_DEV_AUTH_BYPASS = 'true'
    isLocalDevtoolsRequestHeaders.mockReturnValue(true)

    const payload = {
      find: vi.fn().mockResolvedValue({
        docs: [{ email: 'bg@grimetime.app', id: 7, roles: ['admin'] }],
      }),
    }

    const { loadLocalDevBypassUser } = await import('@/lib/auth/localDevBypass')
    const result = await loadLocalDevBypassUser({
      payload: payload as never,
      requestHeaders: new Headers({ host: 'localhost:5465' }),
    })

    expect(payload.find).toHaveBeenCalledOnce()
    expect(result).toMatchObject({
      email: 'bg@grimetime.app',
      id: 7,
    })
  })
})
