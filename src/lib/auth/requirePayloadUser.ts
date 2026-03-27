import config from '@payload-config'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'
import { getImpersonationUserIdFromCookieHeader } from '@/lib/auth/impersonation'
import { resolveCustomerPayloadUser } from '@/lib/auth/resolveCustomerPayloadUser'
import { isAdminUser } from '@/lib/auth/roles'

export type PayloadRequestAuth = {
  effectiveUser: User
  impersonatedUser: User | null
  isImpersonating: boolean
  isRealAdmin: boolean
  payload: Awaited<ReturnType<typeof getPayload>>
  realUser: User
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

export async function requireRequestAuth(request: Request): Promise<null | PayloadRequestAuth> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  const payloadUser = (user as User | null) ?? null
  const customerAuth = payloadUser ? null : await resolveCustomerPayloadUser()
  const realUser = payloadUser ?? customerAuth?.user ?? null

  if (!realUser) {
    return null
  }

  const impersonationUserId = getImpersonationUserIdFromCookieHeader(request.headers.get('cookie'))
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
