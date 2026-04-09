import { beforeEach, describe, expect, it, vi } from 'vitest'

const isClerkCustomerAuthPrimaryServer = vi.fn()
const findCustomerUserByEmail = vi.fn()
const provisionPortalAccess = vi.fn()

vi.mock('@/lib/auth/customerAuthMode', () => ({
  isClerkCustomerAuthPrimaryServer,
}))

vi.mock('@/lib/auth/portal-access/claims', () => ({
  findCustomerUserByEmail,
}))

vi.mock('@/lib/auth/portal-access/provision', () => ({
  provisionPortalAccess,
}))

describe('resolvePortalAccessCta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isClerkCustomerAuthPrimaryServer.mockReturnValue(true)
    provisionPortalAccess.mockResolvedValue({
      expiresAt: '2026-04-09T12:00:00.000Z',
      link: 'https://www.grimetime.app/claim-account?claim=abc',
    })
  })

  it('keeps active Clerk-bound users on the existing portal path', async () => {
    findCustomerUserByEmail.mockResolvedValue({
      clerkUserID: 'user_clerk_123',
      portalInviteState: 'active',
      supabaseAuthUserID: 'supabase_legacy_123',
    })

    const { resolvePortalAccessCta } = await import('@/lib/email/portalAccessCta')
    const result = await resolvePortalAccessCta({
      customerEmail: 'customer@example.com',
      nextPath: '/invoices',
      payload: {} as never,
    })

    expect(result).toBeNull()
    expect(provisionPortalAccess).not.toHaveBeenCalled()
  })

  it('reissues portal access for Supabase-only active users when Clerk is primary', async () => {
    findCustomerUserByEmail.mockResolvedValue({
      clerkUserID: null,
      id: 17,
      portalInviteState: 'active',
      supabaseAuthUserID: 'supabase_legacy_123',
    })

    const { resolvePortalAccessCta } = await import('@/lib/email/portalAccessCta')
    const result = await resolvePortalAccessCta({
      customerEmail: 'customer@example.com',
      nextPath: '/invoices',
      payload: {} as never,
    })

    expect(result).toEqual({
      expiresAt: '2026-04-09T12:00:00.000Z',
      link: 'https://www.grimetime.app/claim-account?claim=abc',
      mode: 'claim',
    })
    expect(provisionPortalAccess).toHaveBeenCalledWith({
      mode: 'claim',
      nextPath: '/invoices',
      payload: {} as never,
      user: expect.objectContaining({
        id: 17,
      }),
    })
  })

  it('still treats Supabase-only active users as complete when Clerk is not primary', async () => {
    isClerkCustomerAuthPrimaryServer.mockReturnValue(false)
    findCustomerUserByEmail.mockResolvedValue({
      clerkUserID: null,
      portalInviteState: 'active',
      supabaseAuthUserID: 'supabase_legacy_123',
    })

    const { resolvePortalAccessCta } = await import('@/lib/email/portalAccessCta')
    const result = await resolvePortalAccessCta({
      customerEmail: 'customer@example.com',
      nextPath: '/invoices',
      payload: {} as never,
    })

    expect(result).toBeNull()
    expect(provisionPortalAccess).not.toHaveBeenCalled()
  })
})
