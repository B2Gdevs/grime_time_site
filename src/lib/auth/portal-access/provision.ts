import type { Payload } from 'payload'

import { USERS_COLLECTION_SLUG } from '@/collections/Users'
import {
  PORTAL_ACCESS_DEFAULT_NEXT_PATH,
  type PortalInviteState,
} from '@/lib/auth/portal-access/constants'
import { createPortalAccessLink } from '@/lib/auth/portal-access/link'
import {
  createPortalAccessToken,
  hashPortalAccessToken,
  portalAccessExpiryDate,
} from '@/lib/auth/portal-access/token'
import type { User } from '@/payload-types'

function stateForMode(mode: 'claim' | 'invite'): PortalInviteState {
  return mode === 'invite' ? 'invite_pending' : 'claim_pending'
}

export async function provisionPortalAccess(args: {
  mode: 'claim' | 'invite'
  nextPath?: string
  payload: Payload
  user: User
}) {
  const token = createPortalAccessToken()
  const expiresAt = portalAccessExpiryDate()

  await args.payload.update({
    collection: USERS_COLLECTION_SLUG,
    id: args.user.id,
    data: {
      portalInviteExpiresAt: expiresAt,
      portalInviteSentAt: new Date().toISOString(),
      portalInviteState: stateForMode(args.mode),
      portalInviteTokenHash: hashPortalAccessToken(token),
    },
    overrideAccess: true,
  })

  return {
    expiresAt,
    link: createPortalAccessLink({
      nextPath: args.nextPath ?? PORTAL_ACCESS_DEFAULT_NEXT_PATH,
      token,
    }),
    token,
  }
}
