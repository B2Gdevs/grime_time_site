import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
const refresh = vi.fn()
const useAuth = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}))

vi.mock('@clerk/nextjs', () => ({
  Show: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth,
}))

describe('ClaimAccountForm', () => {
  const originalPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_clerk'
    useAuth.mockReturnValue({ isSignedIn: false })
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        preview: {
          accountName: 'North Texas Ops',
          email: 'crew@example.com',
          expiresAt: null,
          mode: 'invite',
          name: 'Crew Lead',
        },
      }),
    } as Response)
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPublishableKey
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('renders Clerk invite copy for company-access tokens', async () => {
    const { ClaimAccountForm } = await import('@/components/auth/login/ClaimAccountForm')

    render(<ClaimAccountForm claimToken="invite-token" nextPath="/account" />)

    await waitFor(() => {
      expect(screen.getByText('Company invite ready')).toBeTruthy()
    })

    expect(screen.getAllByText('crew@example.com').length).toBeGreaterThan(0)
    expect(screen.getByText('North Texas Ops')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sign in to join company' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Create account and join company' })).toBeTruthy()
    expect(screen.getByText(/Use crew@example.com to join North Texas Ops/i)).toBeTruthy()
  })
})
