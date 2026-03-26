import type { User } from '@/payload-types'
import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { isAdminUser } from '@/lib/auth/roles'

export async function getCurrentPayloadUser(): Promise<User | null> {
  const auth = await getCurrentAuthContext()
  return auth.effectiveUser
}

export async function requirePayloadUser(): Promise<User> {
  const user = await getCurrentPayloadUser()

  if (!user) {
    throw new Error('Authenticated user required')
  }

  return user
}

export function userIsAdmin(
  user: (User & { roles?: null | string | string[] }) | null | undefined,
): boolean {
  return isAdminUser(user)
}
