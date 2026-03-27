import config from '@payload-config'
import { cookies, headers } from 'next/headers'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'
import { isAdminUser } from '@/lib/auth/roles'
import { resolveCustomerPayloadUser } from '@/lib/auth/resolveCustomerPayloadUser'
import { getImpersonationUserIdFromCookies } from './impersonation'

export type PayloadAuthContext = {
  effectiveUser: User | null
  impersonatedUser: User | null
  isImpersonating: boolean
  isRealAdmin: boolean
  payload: Awaited<ReturnType<typeof getPayload>>
  realUser: User | null
}

async function loadImpersonatedUser(args: {
  impersonationUserId: number | null
  payload: Awaited<ReturnType<typeof getPayload>>
  realUser: User | null
}): Promise<User | null> {
  if (!args.realUser || !isAdminUser(args.realUser) || args.impersonationUserId == null) {
    return null
  }

  if (Number(args.realUser.id) === args.impersonationUserId) {
    return null
  }

  try {
    const user = await args.payload.findByID({
      collection: 'users',
      depth: 0,
      id: args.impersonationUserId,
      overrideAccess: true,
    })

    return (user as User) ?? null
  } catch {
    return null
  }
}

export async function getCurrentAuthContext(): Promise<PayloadAuthContext> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const cookieStore = await cookies()
  const { user } = await payload.auth({ headers: requestHeaders })
  const payloadUser = (user as User | null) ?? null
  const customerAuth = payloadUser ? null : await resolveCustomerPayloadUser()
  const realUser = payloadUser ?? customerAuth?.user ?? null
  const impersonationUserId = getImpersonationUserIdFromCookies(cookieStore)
  const impersonatedUser = await loadImpersonatedUser({
    impersonationUserId,
    payload: customerAuth?.payload ?? payload,
    realUser,
  })

  return {
    effectiveUser: impersonatedUser ?? realUser,
    impersonatedUser,
    isImpersonating: Boolean(impersonatedUser),
    isRealAdmin: isAdminUser(realUser),
    payload: customerAuth?.payload ?? payload,
    realUser,
  }
}
