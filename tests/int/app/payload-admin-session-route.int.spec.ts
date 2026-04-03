import { beforeEach, describe, expect, it, vi } from 'vitest'

const cookieSet = vi.fn()
const cookiesMock = vi.fn()
const generatePayloadCookie = vi.fn()
const getFieldsToSign = vi.fn()
const jwtSign = vi.fn()
const requireRequestAuth = vi.fn()

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}))

vi.mock('payload', () => ({
  generatePayloadCookie,
  getFieldsToSign,
  jwtSign,
}))

vi.mock('@/lib/auth/requirePayloadUser', () => ({
  requireRequestAuth,
}))

describe('payload admin session route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cookiesMock.mockResolvedValue({ set: cookieSet })
    getFieldsToSign.mockReturnValue({ email: 'staff@example.com', id: 17 })
    jwtSign.mockResolvedValue({ token: 'payload-jwt-token' })
    generatePayloadCookie.mockReturnValue({
      domain: undefined,
      expires: undefined,
      name: 'payload-token',
      path: '/',
      sameSite: 'Lax',
      secure: false,
      value: 'payload-jwt-token',
    })
  })

  it('sets a Payload auth cookie and redirects admins into /admin', async () => {
    requireRequestAuth.mockResolvedValue({
      isRealAdmin: true,
      payload: {
        collections: {
          users: {
            config: {
              auth: {
                cookies: {
                  sameSite: 'lax',
                },
                tokenExpiration: 7200,
              },
              slug: 'users',
            },
          },
        },
        config: {
          cookiePrefix: 'payload',
          secret: 'payload-secret',
        },
      },
      realUser: {
        email: 'staff@example.com',
        id: 17,
        roles: ['admin'],
      },
    })

    const { GET } = await import('@/app/api/internal/admin/payload-session/route')
    const response = await GET(
      new Request('http://localhost:5465/api/internal/admin/payload-session?next=/admin'),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:5465/admin')
    expect(getFieldsToSign).toHaveBeenCalled()
    expect(jwtSign).toHaveBeenCalled()
    expect(cookieSet).toHaveBeenCalledWith(
      'payload-token',
      'payload-jwt-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        secure: false,
      }),
    )
  })

  it('redirects non-admin users back to login without issuing a Payload session', async () => {
    requireRequestAuth.mockResolvedValue({
      isRealAdmin: false,
      payload: {
        collections: {},
        config: {
          cookiePrefix: 'payload',
          secret: 'payload-secret',
        },
      },
      realUser: {
        email: 'designer@example.com',
        id: 23,
        roles: ['customer'],
      },
    })

    const { GET } = await import('@/app/api/internal/admin/payload-session/route')
    const response = await GET(
      new Request('http://localhost:5465/api/internal/admin/payload-session?next=/admin'),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:5465/login')
    expect(jwtSign).not.toHaveBeenCalled()
    expect(cookieSet).not.toHaveBeenCalled()
  })
})
