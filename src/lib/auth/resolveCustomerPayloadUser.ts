import config from '@payload-config'
import { getPayload } from 'payload'

import { USERS_COLLECTION_SLUG } from '@/collections/Users'
import type { User } from '@/payload-types'
import { findCustomerUserByEmail } from '@/lib/auth/portal-access/claims'
import { isAdminUser } from '@/lib/auth/roles'
import { getSupabaseServerUser } from '@/lib/supabase/server'

function readSupabaseDisplayName(user: {
  email?: null | string
  user_metadata?: Record<string, unknown>
}) {
  const metadataName = user.user_metadata?.name
  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim()
  }

  return user.email?.split('@')[0] || 'Customer'
}

export async function resolveCustomerPayloadUser() {
  const supabaseUser = await getSupabaseServerUser()

  if (!supabaseUser?.email) {
    return null
  }

  const payload = await getPayload({ config })
  const normalizedEmail = supabaseUser.email.trim().toLowerCase()
  let existingUser: User | null = null

  if (supabaseUser.id) {
    const existingBySupabaseID = await payload.find({
      collection: USERS_COLLECTION_SLUG,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        supabaseAuthUserID: {
          equals: supabaseUser.id,
        },
      },
    })

    existingUser = (existingBySupabaseID.docs[0] as User | undefined) ?? null
  }

  if (!existingUser) {
    existingUser = await findCustomerUserByEmail(normalizedEmail, payload)
  }

  if (existingUser) {
    if (isAdminUser(existingUser)) {
      return null
    }

    const updatedUser = (await payload.update({
      collection: USERS_COLLECTION_SLUG,
      id: existingUser.id,
      data: {
        emailVerifiedAt: new Date().toISOString(),
        lastPortalLoginAt: new Date().toISOString(),
        portalInviteState:
          existingUser.portalInviteState === 'invite_pending' ||
          existingUser.portalInviteState === 'claim_pending'
            ? 'active'
            : existingUser.portalInviteState || 'active',
        portalInviteTokenHash:
          existingUser.portalInviteState === 'invite_pending' ||
          existingUser.portalInviteState === 'claim_pending'
            ? null
            : existingUser.portalInviteTokenHash,
        portalInviteExpiresAt:
          existingUser.portalInviteState === 'invite_pending' ||
          existingUser.portalInviteState === 'claim_pending'
            ? null
            : existingUser.portalInviteExpiresAt,
        supabaseAuthUserID: supabaseUser.id,
      },
      overrideAccess: true,
    })) as User

    return {
      payload,
      user: updatedUser,
    }
  }

  const createdUser = (await payload.create({
    collection: USERS_COLLECTION_SLUG,
    data: {
      emailVerifiedAt: new Date().toISOString(),
      email: normalizedEmail,
      lastPortalLoginAt: new Date().toISOString(),
      name: readSupabaseDisplayName({
        email: normalizedEmail,
        user_metadata: supabaseUser.user_metadata,
      }),
      portalInviteState: 'active',
      roles: ['customer'],
      supabaseAuthUserID: supabaseUser.id,
    },
    overrideAccess: true,
  })) as User

  return {
    payload,
    user: createdUser,
  }
}
