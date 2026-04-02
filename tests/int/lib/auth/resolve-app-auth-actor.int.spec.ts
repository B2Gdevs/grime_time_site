import { beforeEach, describe, expect, it, vi } from 'vitest'

const isClerkCustomerAuthPrimaryServer = vi.fn()
const resolveCustomerPayloadUser = vi.fn()

vi.mock('@/lib/auth/customerAuthMode', () => ({
  isClerkCustomerAuthPrimaryServer,
}))

vi.mock('@/lib/auth/resolveCustomerPayloadUser', () => ({
  resolveCustomerPayloadUser,
}))

describe('resolveAppAuthActor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefers the Clerk-mapped app actor over a Payload session when Clerk is primary', async () => {
    isClerkCustomerAuthPrimaryServer.mockReturnValue(true)
    const clerkUser = {
      id: 11,
      clerkUserID: 'clerk_admin_1',
      email: 'ops@example.com',
      roles: ['admin'],
    }
    resolveCustomerPayloadUser.mockResolvedValue({
      payload: { source: 'clerk' },
      user: clerkUser,
    })

    const payloadAuth = vi.fn().mockResolvedValue({
      user: {
        id: 12,
        email: 'legacy-admin@example.com',
        roles: ['admin'],
      },
    })

    const { resolveAppAuthActor } = await import('@/lib/auth/resolveAppAuthActor')
    const result = await resolveAppAuthActor({
      payload: { auth: payloadAuth } as never,
      payloadHeaderCandidates: [new Headers({ cookie: 'payload-token=abc' })],
    })

    expect(result.realUser).toEqual(clerkUser)
    expect(result.payload).toEqual({ source: 'clerk' })
    expect(result.payloadUser).toMatchObject({
      email: 'legacy-admin@example.com',
    })
  })

  it('falls back to the Payload session when Clerk is primary but no Clerk-backed actor resolves', async () => {
    isClerkCustomerAuthPrimaryServer.mockReturnValue(true)
    resolveCustomerPayloadUser.mockResolvedValue(null)

    const payloadUser = {
      id: 21,
      email: 'payload-admin@example.com',
      roles: ['admin'],
    }
    const payloadAuth = vi.fn().mockResolvedValue({
      user: payloadUser,
    })

    const { resolveAppAuthActor } = await import('@/lib/auth/resolveAppAuthActor')
    const result = await resolveAppAuthActor({
      payload: { auth: payloadAuth } as never,
      payloadHeaderCandidates: [new Headers({ cookie: 'payload-token=abc' })],
    })

    expect(result.realUser).toEqual(payloadUser)
    expect(result.payload).toEqual({ auth: payloadAuth })
  })

  it('keeps Payload-first behavior when Clerk is not the active auth mode', async () => {
    isClerkCustomerAuthPrimaryServer.mockReturnValue(false)

    const payloadUser = {
      id: 31,
      email: 'payload-admin@example.com',
      roles: ['admin'],
    }
    const payloadAuth = vi.fn().mockResolvedValue({
      user: payloadUser,
    })

    const { resolveAppAuthActor } = await import('@/lib/auth/resolveAppAuthActor')
    const result = await resolveAppAuthActor({
      payload: { auth: payloadAuth } as never,
      payloadHeaderCandidates: [new Headers({ cookie: 'payload-token=abc' })],
    })

    expect(resolveCustomerPayloadUser).not.toHaveBeenCalled()
    expect(result.realUser).toEqual(payloadUser)
    expect(result.payload).toEqual({ auth: payloadAuth })
  })
})
