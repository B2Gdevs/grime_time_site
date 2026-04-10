import { randomBytes } from 'node:crypto'

import type {
  DeletedObjectJSON,
  OrganizationJSON,
  OrganizationMembershipJSON,
  UserJSON,
  WebhookEvent,
} from '@clerk/backend'
import type { Payload } from 'payload'

import { USERS_COLLECTION_SLUG } from '@/collections/Users'
import { createAuthDomainEvent } from '@/lib/auth/domainEvents'
import { getUserOrganizationMembership, syncUserLegacyRolesFromMemberships } from '@/lib/auth/organizationAccess'
import {
  DEFAULT_GRIME_TIME_CLERK_ORG_ID,
  DEFAULT_GRIME_TIME_ORGANIZATION_SLUG,
  ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
  ORGANIZATIONS_COLLECTION_SLUG,
} from '@/lib/auth/organizationConstants'
import type {
  OrganizationKind,
  OrganizationMembershipRoleTemplate,
} from '@/lib/auth/organizationRoles'
import type { Organization, OrganizationMembership, User } from '@/payload-types'

type ClerkUserPayload = UserJSON
type ClerkDeletedUserPayload = DeletedObjectJSON
type ClerkOrganizationPayload = OrganizationJSON
type ClerkDeletedOrganizationPayload = DeletedObjectJSON
type ClerkMembershipPayload = OrganizationMembershipJSON
type ClerkDeletedMembershipPayload = OrganizationMembershipJSON

export type ClerkWebhookHandleResult = {
  handled: boolean
  scope: 'ignored' | 'membership' | 'organization' | 'user'
  summary: string
}

function normalizeEmail(email: null | string | undefined): string | null {
  return typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null
}

function toIsoString(value: null | number | undefined): string {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return new Date(value).toISOString()
  }

  return new Date().toISOString()
}

function buildLocalOnlyPassword(): string {
  return `clerk-only-${randomBytes(18).toString('base64url')}`
}

function slugifyOrganization(args: {
  clerkOrgID: string
  name: null | string | undefined
  slug: null | string | undefined
}): string {
  const preferred = args.slug?.trim() || args.name?.trim() || DEFAULT_GRIME_TIME_ORGANIZATION_SLUG
  const normalized = preferred
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (normalized) {
    return normalized
  }

  return `org-${args.clerkOrgID.slice(-8).toLowerCase()}`
}

function buildDisplayName(args: {
  email?: null | string
  firstName?: null | string
  lastName?: null | string
  username?: null | string
}): string {
  const fullName = [args.firstName, args.lastName].filter(Boolean).join(' ').trim()

  if (fullName) {
    return fullName
  }

  if (args.username?.trim()) {
    return args.username.trim()
  }

  if (args.email?.trim()) {
    return args.email.trim().split('@')[0] || args.email.trim()
  }

  return 'Clerk user'
}

function inferOrganizationKind(
  clerkOrgID: string,
  existing: null | Pick<Organization, 'kind'>,
): OrganizationKind {
  if (clerkOrgID === DEFAULT_GRIME_TIME_CLERK_ORG_ID) {
    return 'staff'
  }

  return existing?.kind === 'staff' || existing?.kind === 'customer' ? existing.kind : 'customer'
}

function mapClerkRoleToMembershipRole(args: {
  clerkRole: null | string | undefined
  email: null | string | undefined
  organizationKind: OrganizationKind
}): OrganizationMembershipRoleTemplate {
  const normalizedEmail = normalizeEmail(args.email)
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL)

  if (args.organizationKind === 'staff') {
    if (adminEmail && normalizedEmail === adminEmail) {
      return 'staff-owner'
    }

    const role = args.clerkRole?.trim().toLowerCase() || ''

    if (role.includes('owner')) {
      return 'staff-owner'
    }

    if (role.includes('admin')) {
      return 'staff-admin'
    }

    return 'staff-designer'
  }

  return (args.clerkRole?.trim().toLowerCase() || '').includes('admin')
    ? 'customer-admin'
    : 'customer-member'
}

function readPrimaryClerkEmail(user: ClerkUserPayload): { email: null | string; verified: boolean } {
  const primary =
    user.email_addresses.find((entry) => entry.id === user.primary_email_address_id) ||
    user.email_addresses[0]
  const email = normalizeEmail(primary?.email_address)

  return {
    email,
    verified: primary?.verification?.status === 'verified',
  }
}

async function findOne<T>(args: {
  collection:
    | typeof ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG
    | typeof ORGANIZATIONS_COLLECTION_SLUG
    | typeof USERS_COLLECTION_SLUG
  payload: Payload
  where: object
}): Promise<null | T> {
  const result = await args.payload.find({
    collection: args.collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: args.where,
  } as never)

  return (result.docs[0] as T | undefined) ?? null
}

async function findUserByClerkUserID(
  payload: Payload,
  clerkUserID: string,
): Promise<null | User> {
  return findOne<User>({
    collection: USERS_COLLECTION_SLUG,
    payload,
    where: {
      clerkUserID: {
        equals: clerkUserID,
      },
    },
  })
}

async function findUserByEmail(payload: Payload, email: string): Promise<null | User> {
  return findOne<User>({
    collection: USERS_COLLECTION_SLUG,
    payload,
    where: {
      email: {
        equals: email,
      },
    },
  })
}

async function findOrganizationByClerkOrgID(
  payload: Payload,
  clerkOrgID: string,
): Promise<null | Organization> {
  return findOne<Organization>({
    collection: ORGANIZATIONS_COLLECTION_SLUG,
    payload,
    where: {
      clerkOrgID: {
        equals: clerkOrgID,
      },
    },
  })
}

async function findOrganizationBySlug(payload: Payload, slug: string): Promise<null | Organization> {
  return findOne<Organization>({
    collection: ORGANIZATIONS_COLLECTION_SLUG,
    payload,
    where: {
      slug: {
        equals: slug,
      },
    },
  })
}

async function findMembershipByClerkMembershipID(
  payload: Payload,
  clerkMembershipID: string,
): Promise<null | OrganizationMembership> {
  return findOne<OrganizationMembership>({
    collection: ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
    payload,
    where: {
      clerkMembershipID: {
        equals: clerkMembershipID,
      },
    },
  })
}

async function upsertUserFromWebhook(args: {
  clerkUserID: string
  email: null | string
  emailVerifiedAt?: null | string
  name: string
  payload: Payload
}): Promise<null | User> {
  if (!args.email) {
    return null
  }

  const existing =
    (await findUserByClerkUserID(args.payload, args.clerkUserID)) ||
    (await findUserByEmail(args.payload, args.email))

  if (existing) {
    return (await args.payload.update({
      collection: USERS_COLLECTION_SLUG,
      id: existing.id,
      data: {
        clerkUserID: args.clerkUserID,
        email: args.email,
        emailVerifiedAt: args.emailVerifiedAt || existing.emailVerifiedAt,
        name: args.name || existing.name,
      },
      overrideAccess: true,
    })) as User
  }

  return (await args.payload.create({
    collection: USERS_COLLECTION_SLUG,
    data: {
      clerkUserID: args.clerkUserID,
      email: args.email,
      emailVerifiedAt: args.emailVerifiedAt || undefined,
      name: args.name,
      password: buildLocalOnlyPassword(),
      roles: ['customer'],
    },
    overrideAccess: true,
  })) as User
}

async function upsertUserFromClerkUserEvent(args: {
  payload: Payload
  user: ClerkUserPayload
}): Promise<null | User> {
  const { email, verified } = readPrimaryClerkEmail(args.user)

  return upsertUserFromWebhook({
    clerkUserID: args.user.id,
    email,
    emailVerifiedAt: verified ? toIsoString(args.user.updated_at || args.user.created_at) : null,
    name: buildDisplayName({
      email,
      firstName: args.user.first_name,
      lastName: args.user.last_name,
      username: args.user.username,
    }),
    payload: args.payload,
  })
}

async function upsertUserFromMembershipEvent(args: {
  clerkMembership: ClerkMembershipPayload | ClerkDeletedMembershipPayload
  payload: Payload
}): Promise<null | User> {
  const email = normalizeEmail(args.clerkMembership.public_user_data.identifier)

  return upsertUserFromWebhook({
    clerkUserID: args.clerkMembership.public_user_data.user_id,
    email,
    name: buildDisplayName({
      email,
      firstName: args.clerkMembership.public_user_data.first_name,
      lastName: args.clerkMembership.public_user_data.last_name,
    }),
    payload: args.payload,
  })
}

async function upsertOrganizationFromClerkEvent(args: {
  organization: ClerkOrganizationPayload | ClerkMembershipPayload['organization']
  payload: Payload
}): Promise<Organization> {
  const existingByClerkID = await findOrganizationByClerkOrgID(args.payload, args.organization.id)
  const slug = slugifyOrganization({
    clerkOrgID: args.organization.id,
    name: args.organization.name,
    slug: args.organization.slug,
  })
  const existingBySlug =
    existingByClerkID || (await findOrganizationBySlug(args.payload, slug))
  const kind = inferOrganizationKind(args.organization.id, existingBySlug)

  if (existingBySlug) {
    return (await args.payload.update({
      collection: ORGANIZATIONS_COLLECTION_SLUG,
      id: existingBySlug.id,
      data: {
        clerkOrgID: args.organization.id,
        kind,
        lastSyncedAt: toIsoString(args.organization.updated_at || args.organization.created_at),
        name: args.organization.name,
        provider: 'clerk',
        slug,
        status: existingBySlug.status || 'active',
        syncSource: 'webhook',
      },
      overrideAccess: true,
    })) as Organization
  }

  return (await args.payload.create({
    collection: ORGANIZATIONS_COLLECTION_SLUG,
    data: {
      clerkOrgID: args.organization.id,
      kind,
      lastSyncedAt: toIsoString(args.organization.updated_at || args.organization.created_at),
      name: args.organization.name,
      provider: 'clerk',
      slug,
      status: 'active',
      syncSource: 'webhook',
    },
    overrideAccess: true,
  })) as Organization
}

async function upsertMembershipFromClerkEvent(args: {
  clerkMembership: ClerkMembershipPayload
  organization: Organization
  payload: Payload
  user: User
}): Promise<OrganizationMembership> {
  const existing =
    (await findMembershipByClerkMembershipID(args.payload, args.clerkMembership.id)) ||
    (await getUserOrganizationMembership(args.payload, {
      organizationId: Number(args.organization.id),
      userId: Number(args.user.id),
    }))
  const roleTemplate = mapClerkRoleToMembershipRole({
    clerkRole: args.clerkMembership.role,
    email: args.user.email,
    organizationKind: args.organization.kind === 'staff' ? 'staff' : 'customer',
  })
  const data = {
    clerkMembershipID: args.clerkMembership.id,
    lastSyncedAt: toIsoString(args.clerkMembership.updated_at || args.clerkMembership.created_at),
    organization: args.organization.id,
    roleTemplate,
    status: 'active' as const,
    syncSource: 'webhook' as const,
    user: args.user.id,
  }

  if (existing) {
    const updated = (await args.payload.update({
      collection: ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
      id: existing.id,
      data,
      overrideAccess: true,
    })) as OrganizationMembership

    await syncUserLegacyRolesFromMemberships(args.payload, Number(args.user.id), {
      pendingMembership: updated,
    })

    return updated
  }

  const created = (await args.payload.create({
    collection: ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
    data,
    overrideAccess: true,
  })) as OrganizationMembership

  await syncUserLegacyRolesFromMemberships(args.payload, Number(args.user.id), {
    pendingMembership: created,
  })

  return created
}

async function revokeMembershipFromClerkEvent(args: {
  clerkMembership: ClerkDeletedMembershipPayload
  payload: Payload
  user: null | User
}): Promise<null | OrganizationMembership> {
  const existing = await findMembershipByClerkMembershipID(args.payload, args.clerkMembership.id)

  if (!existing) {
    return null
  }

  const revoked = (await args.payload.update({
    collection: ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
    id: existing.id,
    data: {
      lastSyncedAt: toIsoString(args.clerkMembership.updated_at || args.clerkMembership.created_at),
      status: 'revoked',
      syncSource: 'webhook',
    },
    overrideAccess: true,
  })) as OrganizationMembership

  if (args.user?.id) {
    await syncUserLegacyRolesFromMemberships(args.payload, Number(args.user.id), {
      pendingMembership: revoked,
    })
  }

  return revoked
}

async function disableOrganizationFromClerkEvent(args: {
  clerkOrganization: ClerkDeletedOrganizationPayload
  payload: Payload
}): Promise<null | Organization> {
  const existing =
    (args.clerkOrganization.id
      ? await findOrganizationByClerkOrgID(args.payload, args.clerkOrganization.id)
      : null) ||
    (args.clerkOrganization.slug
      ? await findOrganizationBySlug(args.payload, args.clerkOrganization.slug)
      : null)

  if (!existing) {
    return null
  }

  return (await args.payload.update({
    collection: ORGANIZATIONS_COLLECTION_SLUG,
    id: existing.id,
    data: {
      lastSyncedAt: new Date().toISOString(),
      status: 'disabled',
      syncSource: 'webhook',
    },
    overrideAccess: true,
  })) as Organization
}

async function unlinkDeletedClerkUser(args: {
  clerkUser: ClerkDeletedUserPayload
  payload: Payload
}): Promise<null | User> {
  if (!args.clerkUser.id) {
    return null
  }

  const existing = await findUserByClerkUserID(args.payload, args.clerkUser.id)

  if (!existing) {
    return null
  }

  return (await args.payload.update({
    collection: USERS_COLLECTION_SLUG,
    id: existing.id,
    data: {
      clerkUserID: null,
    },
    overrideAccess: true,
  })) as User
}

export async function handleClerkWebhookEvent(args: {
  event: WebhookEvent
  payload: Payload
}): Promise<ClerkWebhookHandleResult> {
  if (args.event.type === 'user.created' || args.event.type === 'user.updated') {
    const user = await upsertUserFromClerkUserEvent({
      payload: args.payload,
      user: args.event.data,
    })

    if (!user) {
      return {
        handled: false,
        scope: 'user',
        summary: 'Skipped Clerk user sync because no primary email was available.',
      }
    }

    await createAuthDomainEvent({
      details: {
        clerkUserID: args.event.data.id,
      },
      eventLabel: `Clerk user synced for ${user.email}`,
      eventType: 'user_synced',
      occurredAt: toIsoString(args.event.data.updated_at || args.event.data.created_at),
      payload: args.payload,
      sourceSystem: 'webhook',
      targetUserId: Number(user.id),
    })

    return {
      handled: true,
      scope: 'user',
      summary: `Synced Clerk user ${user.email}.`,
    }
  }

  if (args.event.type === 'user.deleted') {
    const user = await unlinkDeletedClerkUser({
      clerkUser: args.event.data,
      payload: args.payload,
    })

    if (!user) {
      return {
        handled: false,
        scope: 'user',
        summary: 'No local user matched the deleted Clerk user id.',
      }
    }

    await createAuthDomainEvent({
      details: {
        clerkUserID: args.event.data.id || '',
      },
      eventLabel: `Clerk user link removed for ${user.email}`,
      eventType: 'user_provider_unlinked',
      payload: args.payload,
      sourceSystem: 'webhook',
      targetUserId: Number(user.id),
    })

    return {
      handled: true,
      scope: 'user',
      summary: `Removed Clerk linkage for ${user.email}.`,
    }
  }

  if (args.event.type === 'organization.created' || args.event.type === 'organization.updated') {
    const organization = await upsertOrganizationFromClerkEvent({
      organization: args.event.data,
      payload: args.payload,
    })

    await createAuthDomainEvent({
      details: {
        clerkOrgID: args.event.data.id,
        organizationKind: organization.kind,
      },
      eventLabel: `Organization synced from Clerk: ${organization.name}`,
      eventType: 'organization_synced',
      occurredAt: toIsoString(args.event.data.updated_at || args.event.data.created_at),
      organizationId: Number(organization.id),
      payload: args.payload,
      sourceSystem: 'webhook',
    })

    return {
      handled: true,
      scope: 'organization',
      summary: `Synced organization ${organization.slug}.`,
    }
  }

  if (args.event.type === 'organization.deleted') {
    const organization = await disableOrganizationFromClerkEvent({
      clerkOrganization: args.event.data,
      payload: args.payload,
    })

    if (!organization) {
      return {
        handled: false,
        scope: 'organization',
        summary: 'No local organization matched the deleted Clerk organization.',
      }
    }

    await createAuthDomainEvent({
      details: {
        clerkOrgID: args.event.data.id || '',
        nextStatus: 'disabled',
      },
      eventLabel: `Organization disabled from Clerk: ${organization.name}`,
      eventType: 'organization_status_changed',
      organizationId: Number(organization.id),
      payload: args.payload,
      sourceSystem: 'webhook',
    })

    return {
      handled: true,
      scope: 'organization',
      summary: `Disabled organization ${organization.slug}.`,
    }
  }

  if (
    args.event.type === 'organizationMembership.created' ||
    args.event.type === 'organizationMembership.updated'
  ) {
    const organization = await upsertOrganizationFromClerkEvent({
      organization: args.event.data.organization,
      payload: args.payload,
    })
    const user = await upsertUserFromMembershipEvent({
      clerkMembership: args.event.data,
      payload: args.payload,
    })

    if (!user) {
      return {
        handled: false,
        scope: 'membership',
        summary: 'Skipped Clerk membership sync because the linked user email could not be resolved.',
      }
    }

    const membership = await upsertMembershipFromClerkEvent({
      clerkMembership: args.event.data,
      organization,
      payload: args.payload,
      user,
    })

    await createAuthDomainEvent({
      details: {
        clerkMembershipID: args.event.data.id,
        clerkOrgID: args.event.data.organization.id,
        roleTemplate: membership.roleTemplate,
      },
      eventLabel: `Membership synced from Clerk for ${user.email}`,
      eventType: 'membership_synced',
      membershipId: Number(membership.id),
      occurredAt: toIsoString(args.event.data.updated_at || args.event.data.created_at),
      organizationId: Number(organization.id),
      payload: args.payload,
      sourceSystem: 'webhook',
      targetUserId: Number(user.id),
    })

    return {
      handled: true,
      scope: 'membership',
      summary: `Synced membership ${args.event.data.id} for ${user.email}.`,
    }
  }

  if (args.event.type === 'organizationMembership.deleted') {
    const user = await upsertUserFromMembershipEvent({
      clerkMembership: args.event.data,
      payload: args.payload,
    })
    const membership = await revokeMembershipFromClerkEvent({
      clerkMembership: args.event.data,
      payload: args.payload,
      user,
    })

    if (!membership || !user) {
      return {
        handled: false,
        scope: 'membership',
        summary: 'No local membership matched the deleted Clerk membership.',
      }
    }

    await createAuthDomainEvent({
      details: {
        clerkMembershipID: args.event.data.id,
        nextStatus: 'revoked',
      },
      eventLabel: `Membership revoked from Clerk for ${user.email}`,
      eventType: 'membership_status_changed',
      membershipId: Number(membership.id),
      payload: args.payload,
      sourceSystem: 'webhook',
      targetUserId: Number(user.id),
    })

    return {
      handled: true,
      scope: 'membership',
      summary: `Revoked membership ${args.event.data.id} for ${user.email}.`,
    }
  }

  return {
    handled: false,
    scope: 'ignored',
    summary: `Ignored unsupported Clerk webhook type ${args.event.type}.`,
  }
}
