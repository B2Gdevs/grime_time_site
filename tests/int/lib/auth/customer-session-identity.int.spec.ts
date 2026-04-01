import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const clerkClientMock = vi.fn()
const isClerkCustomerAuthPrimaryServer = vi.fn()
const isSupabaseCustomerAuthFallbackEnabledServer = vi.fn()
const getSupabaseServerUser = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
  clerkClient: clerkClientMock,
}))

vi.mock('@/lib/auth/customerAuthMode', () => ({
  isClerkCustomerAuthPrimaryServer,
  isSupabaseCustomerAuthFallbackEnabledServer,
}))

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerUser,
}))

describe('customer session identity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses Clerk identity without touching Supabase when Clerk is the primary auth path', async () => {
    isClerkCustomerAuthPrimaryServer.mockReturnValue(true)
    isSupabaseCustomerAuthFallbackEnabledServer.mockReturnValue(false)
    authMock.mockResolvedValue({ userId: 'user_clerk_123' })
    clerkClientMock.mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          emailAddresses: [{ emailAddress: 'CrewLead@example.com', id: 'email_1' }],
          firstName: 'Crew',
          id: 'user_clerk_123',
          lastName: 'Lead',
          primaryEmailAddressId: 'email_1',
          username: 'crewlead',
        }),
      },
    })

    const { resolveCustomerSessionIdentity } = await import('@/lib/auth/customerSessionIdentity')
    const identity = await resolveCustomerSessionIdentity()

    expect(identity).toEqual({
      clerkUserID: 'user_clerk_123',
      email: 'crewlead@example.com',
      firstName: 'Crew',
      kind: 'clerk',
      lastName: 'Lead',
      user_metadata: {
        name: 'Crew Lead',
        username: 'crewlead',
      },
    })
    expect(getSupabaseServerUser).not.toHaveBeenCalled()
  })

  it('does not silently fall back to Supabase when Clerk is primary but there is no Clerk session', async () => {
    isClerkCustomerAuthPrimaryServer.mockReturnValue(true)
    isSupabaseCustomerAuthFallbackEnabledServer.mockReturnValue(false)
    authMock.mockResolvedValue({ userId: null })

    const { resolveCustomerSessionIdentity } = await import('@/lib/auth/customerSessionIdentity')
    const identity = await resolveCustomerSessionIdentity()

    expect(identity).toBeNull()
    expect(getSupabaseServerUser).not.toHaveBeenCalled()
  })

  it('uses the Supabase customer session only when fallback auth is explicitly active', async () => {
    isClerkCustomerAuthPrimaryServer.mockReturnValue(false)
    isSupabaseCustomerAuthFallbackEnabledServer.mockReturnValue(true)
    getSupabaseServerUser.mockResolvedValue({
      email: 'legacy.customer@example.com',
      id: 'supabase-user-1',
      user_metadata: {
        name: 'Legacy Customer',
      },
    })

    const { resolveCustomerSessionIdentity } = await import('@/lib/auth/customerSessionIdentity')
    const identity = await resolveCustomerSessionIdentity()

    expect(identity).toEqual({
      email: 'legacy.customer@example.com',
      kind: 'supabase',
      supabaseAuthUserID: 'supabase-user-1',
      user_metadata: {
        name: 'Legacy Customer',
      },
    })
  })
})
