import type { Access, Payload, PayloadRequest } from 'payload'

import type { OrganizationMembership, User } from '@/payload-types'
import { isDemoEmail } from '@/lib/demo/constants'
import { ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG } from '@/lib/auth/organizationConstants'
import {
  resolveOrganizationEntitlements,
  type OrganizationEntitlement,
} from '@/lib/auth/organizationRoles'
import { numericRelationId } from '@/lib/crm/internal/relationship'

type RoleCarrier =
  | {
      email?: unknown
      id?: unknown
      roles?: unknown
    }
  | null
  | undefined

type MembershipWithEntitlementLocks = OrganizationMembership & {
  entitlementLocks?: unknown
}

export type ResolvedOrganizationAccess = {
  canManageMemberships: boolean
  canManageOrganizations: boolean
  entitlements: OrganizationEntitlement[]
  hasPayloadAdminAccess: boolean
  memberships: OrganizationMembership[]
}

function hasLegacyAdminRole(user: RoleCarrier): boolean {
  if (!user || typeof user !== 'object') {
    return false
  }

  if (Array.isArray(user.roles)) {
    return user.roles.includes('admin')
  }

  return user.roles === 'admin'
}

function buildOrganizationAccess(user: RoleCarrier, memberships: OrganizationMembership[]) {
  const membershipEntitlements = memberships.map((membership) =>
    resolveOrganizationEntitlements({
      entitlementLocks: (membership as MembershipWithEntitlementLocks).entitlementLocks,
      roleTemplate: membership.roleTemplate,
    }),
  )
  const entitlements = Array.from(new Set(membershipEntitlements.flat()))
  const legacyAdmin = hasLegacyAdminRole(user)

  return {
    canManageMemberships:
      legacyAdmin || membershipEntitlements.some((entry) => entry.includes('org:manage-members')),
    canManageOrganizations:
      legacyAdmin || membershipEntitlements.some((entry) => entry.includes('org:manage')),
    entitlements,
    hasPayloadAdminAccess:
      legacyAdmin || membershipEntitlements.some((entry) => entry.includes('admin:payload')),
    memberships,
  }
}

async function loadMemberships(payload: Payload, userId: number): Promise<OrganizationMembership[]> {
  const result = await payload.find({
    collection: ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
    depth: 1,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          user: {
            equals: userId,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  })

  return result.docs as OrganizationMembership[]
}

export async function resolveUserOrganizationAccess(
  payload: Payload,
  user: RoleCarrier,
): Promise<ResolvedOrganizationAccess> {
  if (!user || typeof user !== 'object' || typeof user.id !== 'number') {
    return {
      canManageMemberships: false,
      canManageOrganizations: false,
      entitlements: [],
      hasPayloadAdminAccess: false,
      memberships: [],
    }
  }

  const memberships = await loadMemberships(payload, user.id)
  return buildOrganizationAccess(user, memberships)
}

export async function hasPayloadAdminAccess(payload: Payload, user: RoleCarrier): Promise<boolean> {
  if (!user) {
    return false
  }

  if (hasLegacyAdminRole(user)) {
    return true
  }

  return (await resolveUserOrganizationAccess(payload, user)).hasPayloadAdminAccess
}

export async function hasOrganizationEntitlement(
  payload: Payload,
  user: RoleCarrier,
  entitlement: OrganizationEntitlement,
): Promise<boolean> {
  if (!user) {
    return false
  }

  if (hasLegacyAdminRole(user)) {
    return true
  }

  return (await resolveUserOrganizationAccess(payload, user)).entitlements.includes(entitlement)
}

export async function hasContentAuthoringAccess(payload: Payload, user: RoleCarrier): Promise<boolean> {
  if (!user || isDemoEmail(typeof user === 'object' ? (user.email as string | null | undefined) : null)) {
    return false
  }

  return hasOrganizationEntitlement(payload, user, 'content:write')
}

export async function syncUserLegacyRolesFromMemberships(
  payload: Payload,
  userId: number,
  args?: {
    deletedMembershipId?: number | string | null
    pendingMembership?: OrganizationMembership | null
  },
): Promise<void> {
  const user = (await payload.findByID({
    collection: 'users',
    depth: 0,
    id: userId,
    overrideAccess: true,
  })) as User | null

  if (!user) {
    return
  }

  const existingMemberships = await loadMemberships(payload, userId)
  const pendingMembershipId = numericRelationId(
    args?.pendingMembership as null | number | string | { id?: null | number | string } | undefined,
  )
  const deletedMembershipId =
    args?.deletedMembershipId == null ? null : Number(args.deletedMembershipId)
  const mergedMemberships = existingMemberships.filter((membership) => {
    const membershipId = numericRelationId(membership as { id?: null | number | string })

    if (deletedMembershipId != null && membershipId === deletedMembershipId) {
      return false
    }

    if (pendingMembershipId != null && membershipId === pendingMembershipId) {
      return false
    }

    return true
  })

  if (args?.pendingMembership?.status === 'active') {
    mergedMemberships.push(args.pendingMembership)
  }

  const access = buildOrganizationAccess(user, mergedMemberships)
  const existingRoles: Array<'admin' | 'customer'> = Array.isArray(user.roles)
    ? [...user.roles]
    : user.roles === 'admin' || user.roles === 'customer'
      ? [user.roles]
      : []
  const nextRoles: Array<'admin' | 'customer'> = existingRoles.filter((role) => role !== 'admin')

  if (access.hasPayloadAdminAccess) {
    nextRoles.push('admin')
  } else if (nextRoles.length === 0) {
    nextRoles.push('customer')
  }

  const normalizedNextRoles = Array.from(new Set(nextRoles)) as Array<'admin' | 'customer'>
  const normalizedCurrentRoles = Array.from(new Set(existingRoles)) as Array<'admin' | 'customer'>

  if (normalizedCurrentRoles.join('|') === normalizedNextRoles.join('|')) {
    return
  }

  await payload.update({
    collection: 'users',
    id: userId,
    data: {
      roles: normalizedNextRoles,
    },
    overrideAccess: true,
  })
}

export const canManageOrganizations: Access = async ({ req }) => {
  return (await resolveUserOrganizationAccess(req.payload, req.user as RoleCarrier))
    .canManageOrganizations
}

export const canManageMemberships: Access = async ({ req }) => {
  return (await resolveUserOrganizationAccess(req.payload, req.user as RoleCarrier))
    .canManageMemberships
}

export async function getUserOrganizationMembership(
  payload: Payload,
  args: { organizationId: number; req?: PayloadRequest; userId: number },
): Promise<OrganizationMembership | null> {
  const memberships = await payload.find({
    collection: ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
    depth: 1,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req: args.req,
    where: {
      and: [
        {
          organization: {
            equals: args.organizationId,
          },
        },
        {
          user: {
            equals: args.userId,
          },
        },
      ],
    },
  })

  return (memberships.docs[0] as OrganizationMembership | undefined) ?? null
}

export function organizationMembershipUserId(
  membership: Pick<OrganizationMembership, 'user'> | null | undefined,
): number | null {
  return numericRelationId(membership?.user as null | number | string | { id?: null | number | string })
}
