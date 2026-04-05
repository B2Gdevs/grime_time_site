import config from '@payload-config'
import { cookies, headers } from 'next/headers'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'
import { loadLocalDevBypassUser } from '@/lib/auth/localDevBypass'
import { hasPayloadAdminAccess } from '@/lib/auth/organizationAccess'
import { resolveAppAuthActor } from '@/lib/auth/resolveAppAuthActor'
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
  canImpersonate: boolean
  impersonationUserId: number | null
  payload: Awaited<ReturnType<typeof getPayload>>
  realUser: User | null
}): Promise<User | null> {
  if (!args.canImpersonate || args.impersonationUserId == null) {
    return null
  }

  if (Number(args.realUser?.id) === args.impersonationUserId) {
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
  const resolvedAuth = await resolveAppAuthActor({
    payload,
    payloadHeaderCandidates: [requestHeaders],
  })
  const bypassUser = resolvedAuth.realUser
    ? null
    : await loadLocalDevBypassUser({
        payload: resolvedAuth.payload,
        requestHeaders,
      })
  const realUser = resolvedAuth.realUser ?? bypassUser
  const isRealAdmin = realUser
    ? await hasPayloadAdminAccess(resolvedAuth.payload, realUser)
    : false
  const impersonationUserId = getImpersonationUserIdFromCookies(cookieStore)
  const impersonatedUser = await loadImpersonatedUser({
    canImpersonate: isRealAdmin,
    impersonationUserId,
    payload: resolvedAuth.payload,
    realUser,
  })

  return {
    effectiveUser: impersonatedUser ?? realUser,
    impersonatedUser,
    isImpersonating: Boolean(impersonatedUser),
    isRealAdmin,
    payload: resolvedAuth.payload,
    realUser,
  }
}
