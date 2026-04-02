import { randomBytes } from 'node:crypto'

import config from '@payload-config'
import { getPayload } from 'payload'

import { USERS_COLLECTION_SLUG } from '@/collections/Users'
import type { User } from '@/payload-types'
import { resolveCustomerSessionIdentity } from '@/lib/auth/customerSessionIdentity'
import { ensureBootstrapOrganizationMembership } from '@/lib/auth/organizationSync'

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
  const identity = await resolveCustomerSessionIdentity()

  if (!identity?.email) {
    return null
  }

  const payload = await getPayload({ config })
  const normalizedEmail = identity.email.trim().toLowerCase()
  let existingUser: User | null = null

  if (identity.kind === 'clerk') {
    existingUser = await findCustomerUserByClerkID(identity.clerkUserID, payload)
  } else if (identity.kind === 'supabase') {
    existingUser = await findCustomerUserBySupabaseID(identity.supabaseAuthUserID, payload)
  }

  if (!existingUser) {
    existingUser = await findPortalUserByEmail(normalizedEmail, payload)
  }

  if (existingUser) {
    const updatedUser = (await payload.update({
      collection: USERS_COLLECTION_SLUG,
      id: existingUser.id,
      data: {
        clerkUserID:
          identity.kind === 'clerk' ? identity.clerkUserID : existingUser.clerkUserID,
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
        supabaseAuthUserID:
          identity.kind === 'supabase'
            ? identity.supabaseAuthUserID
            : existingUser.supabaseAuthUserID,
      },
      overrideAccess: true,
    })) as User

    return {
      payload,
      user: (await ensureBootstrapForUser(payload, updatedUser)) ?? updatedUser,
    }
  }

  const createdUser = (await payload.create({
    collection: USERS_COLLECTION_SLUG,
    data: {
      password: buildLocalOnlyPassword(),
      emailVerifiedAt: new Date().toISOString(),
      email: normalizedEmail,
      lastPortalLoginAt: new Date().toISOString(),
      name: readIdentityDisplayName(identity),
      portalInviteState: 'active',
      roles: ['customer'],
      clerkUserID: identity.kind === 'clerk' ? identity.clerkUserID : undefined,
      supabaseAuthUserID: identity.kind === 'supabase' ? identity.supabaseAuthUserID : undefined,
    },
    overrideAccess: true,
  })) as User

  return {
    payload,
    user: (await ensureBootstrapForUser(payload, createdUser)) ?? createdUser,
  }
}

async function ensureBootstrapForUser(payload: Awaited<ReturnType<typeof getPayload>>, user: User) {
  await ensureBootstrapOrganizationMembership(payload, user)

  return (await payload.findByID({
    collection: USERS_COLLECTION_SLUG,
    depth: 0,
    id: user.id,
    overrideAccess: true,
  })) as User
}

async function findCustomerUserBySupabaseID(
  supabaseUserID: string,
  payload: Awaited<ReturnType<typeof getPayload>>,
) {
  const existingBySupabaseID = await payload.find({
    collection: USERS_COLLECTION_SLUG,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      supabaseAuthUserID: {
        equals: supabaseUserID,
      },
    },
  })

  return (existingBySupabaseID.docs[0] as User | undefined) ?? null
}

async function findCustomerUserByClerkID(
  clerkUserID: string,
  payload: Awaited<ReturnType<typeof getPayload>>,
) {
  const existingByClerkID = await payload.find({
    collection: USERS_COLLECTION_SLUG,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      clerkUserID: {
        equals: clerkUserID,
      },
    },
  })

  return (existingByClerkID.docs[0] as User | undefined) ?? null
}

async function findPortalUserByEmail(
  email: string,
  payload: Awaited<ReturnType<typeof getPayload>>,
) {
  const result = await payload.find({
    collection: USERS_COLLECTION_SLUG,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: email,
      },
    },
  })

  return (result.docs[0] as User | undefined) ?? null
}

function readIdentityDisplayName(user: {
  email?: null | string
  firstName?: null | string
  lastName?: null | string
  user_metadata?: Record<string, unknown>
}) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  if (fullName) {
    return fullName
  }

  return readSupabaseDisplayName({
    email: user.email,
    user_metadata: user.user_metadata,
  })
}

function buildLocalOnlyPassword(): string {
  return `clerk-only-${randomBytes(18).toString('base64url')}`
}
