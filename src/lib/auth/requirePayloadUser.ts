import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'
import { getImpersonationUserIdFromCookieHeader } from '@/lib/auth/impersonation'
import { loadLocalDevBypassUser } from '@/lib/auth/localDevBypass'
import { hasPayloadAdminAccess } from '@/lib/auth/organizationAccess'
import { resolveAppAuthActor } from '@/lib/auth/resolveAppAuthActor'

export type PayloadRequestAuth = {
  effectiveUser: User
  impersonatedUser: User | null
  isImpersonating: boolean
  isRealAdmin: boolean
  payload: Awaited<ReturnType<typeof getPayload>>
  realUser: User
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

export async function requireRequestAuth(request: Request): Promise<null | PayloadRequestAuth> {
  const payload = await getPayload({ config })
  let fallbackHeaders: Headers | null = null

  try {
    fallbackHeaders = await nextHeaders()
  } catch {
    fallbackHeaders = null
  }

  const resolvedAuth = await resolveAppAuthActor({
    payload,
    payloadHeaderCandidates: [request.headers, fallbackHeaders],
  })
  const requestHeaders = request.headers
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

  if (!realUser) {
    return null
  }

  const impersonationUserId = getImpersonationUserIdFromCookieHeader(request.headers.get('cookie'))
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

export async function requirePayloadUser(request: Request): Promise<null | {
  payload: Awaited<ReturnType<typeof getPayload>>
  realUser: User
  user: User
}> {
  const auth = await requireRequestAuth(request)

  if (!auth) {
    return null
  }

  return {
    payload: auth.payload,
    realUser: auth.realUser,
    user: auth.realUser,
  }
}

export async function requireEffectivePayloadUser(request: Request): Promise<null | {
  effectiveUser: User
  isImpersonating: boolean
  payload: Awaited<ReturnType<typeof getPayload>>
  realUser: User
  user: User
}> {
  const auth = await requireRequestAuth(request)

  if (!auth) {
    return null
  }

  return {
    effectiveUser: auth.effectiveUser,
    isImpersonating: auth.isImpersonating,
    payload: auth.payload,
    realUser: auth.realUser,
    user: auth.effectiveUser,
  }
}
