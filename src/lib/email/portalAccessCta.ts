import type { Payload } from 'payload'

import { isClerkCustomerAuthPrimaryServer } from '@/lib/auth/customerAuthMode'
import { provisionPortalAccess } from '@/lib/auth/portal-access/provision'
import { findCustomerUserByEmail } from '@/lib/auth/portal-access/claims'
import type { User } from '@/payload-types'

export type PortalAccessCta = {
  expiresAt: string
  link: string
  mode: 'claim' | 'invite'
}

function isActivePortalUser(user: User | null): boolean {
  if (!user) return false

  if (user.portalInviteState !== 'active') {
    return false
  }

  if (user.clerkUserID) {
    return true
  }

  return Boolean(user.supabaseAuthUserID) && !isClerkCustomerAuthPrimaryServer()
}

export async function resolvePortalAccessCta(args: {
  customerEmail?: null | string
  customerUser?: null | number | string | User
  nextPath: string
  payload: Payload
}): Promise<null | PortalAccessCta> {
  const normalizedEmail = args.customerEmail?.trim().toLowerCase()
  const relatedUser =
    typeof args.customerUser === 'object' && args.customerUser ? args.customerUser : null

  const user =
    relatedUser ??
    (normalizedEmail ? await findCustomerUserByEmail(normalizedEmail, args.payload) : null)

  if (!user || isActivePortalUser(user)) {
    return null
  }

  const mode = user.portalInviteState === 'invite_pending' ? 'invite' : 'claim'
  const access = await provisionPortalAccess({
    mode,
    nextPath: args.nextPath,
    payload: args.payload,
    user,
  })

  return {
    expiresAt: access.expiresAt,
    link: access.link,
    mode,
  }
}
