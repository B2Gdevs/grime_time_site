import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const useSearchParams = vi.fn()

vi.mock('next/navigation', () => ({
  useSearchParams,
}))

vi.mock('@clerk/nextjs', () => ({
  Show: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => <div>UserButton</div>,
}))

describe('CustomerLoginCard', () => {
  const originalPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  beforeEach(() => {
    useSearchParams.mockReturnValue(new URLSearchParams())
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_clerk'
    vi.resetModules()
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPublishableKey
    vi.clearAllMocks()
  })

  it('renders Clerk entry points when Clerk is configured', async () => {
    const { CustomerLoginCard } = await import('@/components/auth/login/CustomerLoginCard')

    render(<CustomerLoginCard />)

    expect(screen.getByText('Customer account')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Customer sign in' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeTruthy()
    expect(
      screen.getByText(/Use Clerk sign-in for portal access/i),
    ).toBeTruthy()
  })
})
