import type { Payload, PayloadRequest } from 'payload'
import { createLocalReq, getPayload } from 'payload'

import { USERS_COLLECTION_SLUG } from '@/collections/Users'
import { isAdminUser } from '@/lib/auth/roles'
import type { User } from '@/payload-types'
import config from '@/payload.config'

import { resolveSeedCredentials } from './seed-credentials'

export type AdminSession = {
  payload: Payload
  req: PayloadRequest
  user: User
}

/**
 * Connect to Payload and build a Local API `req` as the same admin used for seeding.
 * @returns null if credentials missing or user is not admin
 */
export async function openPayloadAdminSession(): Promise<AdminSession | null> {
  const creds = resolveSeedCredentials()
  if (!creds) return null

  const payload = await getPayload({ config })
  const { email, password } = creds

  let resolvedUser: User | null = null
  try {
    const loginResult = await payload.login({
      collection: USERS_COLLECTION_SLUG,
      data: { email, password },
    })
    resolvedUser = (loginResult.user as User | null) ?? null
  } catch {
    const matchedUsers = await payload.find({
      collection: USERS_COLLECTION_SLUG,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { email: { equals: email } },
    })
    resolvedUser = (matchedUsers.docs[0] as User | undefined) ?? null
  }

  if (!resolvedUser || !isAdminUser(resolvedUser)) {
    await payload.destroy().catch(() => {})
    return null
  }

  const req = await createLocalReq({ user: resolvedUser }, payload)
  return { payload, req, user: resolvedUser }
}

export async function withPayloadAdmin<T>(
  fn: (session: AdminSession) => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; code: number; message: string }> {
  const session = await openPayloadAdminSession()
  if (!session) {
    return {
      ok: false,
      code: 1,
      message:
        'Admin session failed. Set SEED_LOGIN_* or ADMIN_EMAIL / ADMIN_PASSWORD (same as seed).',
    }
  }
  try {
    const value = await fn(session)
    return { ok: true, value }
  } finally {
    try {
      await session.payload.destroy()
    } catch {
      /* ignore */
    }
  }
}
