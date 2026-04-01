import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('@clerk/nextjs', () => ({
  Show: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => <div>UserButton</div>,
}))

describe('customer auth recovery surfaces', () => {
  const originalPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  beforeEach(() => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_clerk'
    vi.resetModules()
  })

  afterEach(() => {
    cleanup()
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPublishableKey
    vi.clearAllMocks()
  })

  it('renders Clerk-first forgot-password guidance when Clerk is configured', async () => {
    const { ForgotPasswordForm } = await import('@/components/auth/ForgotPasswordForm')

    render(<ForgotPasswordForm />)

    expect(screen.getByText('Reset access')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Customer sign in' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Send reset link' })).toBeNull()
  })

  it('renders Clerk-first reset-password guidance when Clerk is configured', async () => {
    const { ResetPasswordForm } = await import('@/components/auth/ResetPasswordForm')

    render(<ResetPasswordForm />)

    expect(screen.getByText('Finish password reset')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Customer sign in' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Update password' })).toBeNull()
  })
})
