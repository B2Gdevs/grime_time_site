import type { Payload } from 'payload'

import type { Organization, OrganizationMembership, User } from '@/payload-types'
import { getUserOrganizationMembership, syncUserLegacyRolesFromMemberships } from '@/lib/auth/organizationAccess'
import {
  DEFAULT_GRIME_TIME_CLERK_ORG_ID,
  DEFAULT_GRIME_TIME_ORGANIZATION_SLUG,
  ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
  ORGANIZATIONS_COLLECTION_SLUG,
} from '@/lib/auth/organizationConstants'
import type { OrganizationMembershipRoleTemplate } from '@/lib/auth/organizationRoles'
import { GRIME_TIME_DOMAIN } from '@/lib/brand/emailDefaults'

const DEFAULT_GRIME_TIME_ORGANIZATION = {
  clerkOrgID: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
  kind: 'staff',
  name: 'Grime Time',
  provider: 'clerk',
  slug: DEFAULT_GRIME_TIME_ORGANIZATION_SLUG,
  syncSource: 'app',
} as const

function normalizeEmail(email: null | string | undefined): string | null {
  return typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null
}

function inferBootstrapRole(user: Pick<User, 'email' | 'roles'>): OrganizationMembershipRoleTemplate | null {
  const normalizedEmail = normalizeEmail(user.email)
  if (!normalizedEmail) {
    return null
  }

  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL)

  if (adminEmail && normalizedEmail === adminEmail) {
    return 'staff-owner'
  }

  if (normalizedEmail.endsWith(`@${GRIME_TIME_DOMAIN}`)) {
    return Array.isArray(user.roles) && user.roles.includes('admin') ? 'staff-admin' : 'staff-operator'
  }

  return null
}

async function findDefaultOrganization(payload: Payload): Promise<Organization | null> {
  const byClerk = await payload.find({
    collection: ORGANIZATIONS_COLLECTION_SLUG,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      clerkOrgID: {
        equals: DEFAULT_GRIME_TIME_ORGANIZATION.clerkOrgID,
      },
    },
  })

  if (byClerk.docs[0]) {
    return byClerk.docs[0] as Organization
  }

  const bySlug = await payload.find({
    collection: ORGANIZATIONS_COLLECTION_SLUG,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: DEFAULT_GRIME_TIME_ORGANIZATION.slug,
      },
    },
  })

  return (bySlug.docs[0] as Organization | undefined) ?? null
}

async function ensureDefaultOrganization(payload: Payload): Promise<Organization> {
  const existing = await findDefaultOrganization(payload)

  if (existing) {
    return (await payload.update({
      collection: ORGANIZATIONS_COLLECTION_SLUG,
      id: existing.id,
      data: {
        clerkOrgID: DEFAULT_GRIME_TIME_ORGANIZATION.clerkOrgID,
        kind: DEFAULT_GRIME_TIME_ORGANIZATION.kind,
        name: DEFAULT_GRIME_TIME_ORGANIZATION.name,
        provider: DEFAULT_GRIME_TIME_ORGANIZATION.provider,
        slug: DEFAULT_GRIME_TIME_ORGANIZATION.slug,
        syncSource: DEFAULT_GRIME_TIME_ORGANIZATION.syncSource,
        lastSyncedAt: new Date().toISOString(),
        status: 'active',
      },
      overrideAccess: true,
    })) as Organization
  }

  return (await payload.create({
    collection: ORGANIZATIONS_COLLECTION_SLUG,
    data: {
      ...DEFAULT_GRIME_TIME_ORGANIZATION,
      lastSyncedAt: new Date().toISOString(),
      status: 'active',
    },
    overrideAccess: true,
  })) as Organization
}

export async function ensureBootstrapOrganizationMembership(
  payload: Payload,
  user: User,
): Promise<null | OrganizationMembership> {
  if (typeof payload.find !== 'function' || typeof payload.create !== 'function') {
    return null
  }

  const roleTemplate = inferBootstrapRole(user)

  if (!roleTemplate || typeof user.id !== 'number') {
    return null
  }

  const organization = await ensureDefaultOrganization(payload)
  const existingMembership = await getUserOrganizationMembership(payload, {
    organizationId: Number(organization.id),
    userId: user.id,
  })

  if (existingMembership) {
    await syncUserLegacyRolesFromMemberships(payload, user.id)
    return existingMembership
  }

  const membership = (await payload.create({
    collection: ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
    data: {
      lastSyncedAt: new Date().toISOString(),
      organization: organization.id,
      roleTemplate,
      status: 'active',
      syncSource: 'bootstrap',
      user: user.id,
    },
    overrideAccess: true,
  })) as OrganizationMembership

  await syncUserLegacyRolesFromMemberships(payload, user.id, {
    pendingMembership: membership,
  })

  return membership
}
