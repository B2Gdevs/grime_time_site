import config from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'

import type { User } from '@/payload-types'
import { isAdminUser } from '@/lib/auth/roles'

export async function getCurrentPayloadUser(): Promise<User | null> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  return (user as User | null) ?? null
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
