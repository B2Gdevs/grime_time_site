import type { User } from '@/payload-types'

/**
 * Seeded non-admin account for repeatable customer-flow checks (D-auth-004).
 * Override with PORTAL_PREVIEW_TEST_USER_EMAIL for non-local databases.
 */
export function portalPreviewTestUserEmail(): string {
  return (process.env.PORTAL_PREVIEW_TEST_USER_EMAIL?.trim().toLowerCase() ||
    'test_user@grimetime.local') as string
}

export function isPortalPreviewTestUser(user: Pick<User, 'email'> | null | undefined): boolean {
  const email = user?.email?.trim().toLowerCase()
  if (!email) return false
  return email === portalPreviewTestUserEmail()
}
