import { clerkClient } from '@clerk/nextjs/server'
import { createLocalReq, type Payload, type PayloadRequest } from 'payload'

import { USERS_COLLECTION_SLUG } from '@/collections/Users'
import { getUserOrganizationMembership, syncUserLegacyRolesFromMemberships } from '@/lib/auth/organizationAccess'
import {
  DEFAULT_GRIME_TIME_CLERK_ORG_ID,
  ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
} from '@/lib/auth/organizationConstants'
import {
  ensureBootstrapOrganizationMembership,
  ensureDefaultStaffOrganization,
} from '@/lib/auth/organizationSync'
import type { OrganizationMembershipRoleTemplate } from '@/lib/auth/organizationRoles'
import { OPS_DASHBOARD_PATH } from '@/lib/navigation/portalPaths'
import type { OrganizationMembership, User } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const DEFAULT_INVITE_EXPIRY_DAYS = 7

export type OpsUserAdminAction =
  | { action: 'resync_provider' }
  | { action: 'revoke_staff_invite' }
  | { action: 'reactivate_staff_access' }
  | { action: 'send_staff_invite'; roleTemplate: OrganizationMembershipRoleTemplate }
  | { action: 'suspend_staff_access' }
  | { action: 'update_staff_role'; roleTemplate: OrganizationMembershipRoleTemplate }

export class OpsStaffAdminError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'OpsStaffAdminError'
    this.status = status
  }
}

function normalizeEmail(email: null | string | undefined): string | null {
  return typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null
}

function mapRoleTemplateToClerkRole(roleTemplate: OrganizationMembershipRoleTemplate): string {
  if (roleTemplate === 'staff-owner' || roleTemplate === 'staff-admin') {
    return 'org:admin'
  }

  return 'org:member'
}

async function loadTargetUser(payload: Payload, userId: number): Promise<User> {
  const user = (await payload.findByID({
    collection: USERS_COLLECTION_SLUG,
    depth: 0,
    id: userId,
    overrideAccess: true,
  })) as User | null

  if (!user) {
    throw new OpsStaffAdminError('User not found.', 404)
  }

  return user
}

async function updateUserInviteState(args: {
  payload: Payload
  req: PayloadRequest
  sentAt?: null | string
  state: 'active' | 'invite_pending' | 'none'
  targetUserId: number
}) {
  await args.payload.update({
    collection: USERS_COLLECTION_SLUG,
    id: args.targetUserId,
    data: {
      portalInviteExpiresAt:
        args.state === 'invite_pending' && args.sentAt
          ? new Date(
              Date.parse(args.sentAt) + DEFAULT_INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
            ).toISOString()
          : null,
      portalInviteSentAt: args.state === 'invite_pending' ? args.sentAt ?? new Date().toISOString() : null,
      portalInviteState: args.state,
      portalInviteTokenHash: null,
    },
    overrideAccess: true,
    req: args.req,
  })
}

async function upsertLocalStaffMembership(args: {
  status?: 'active' | 'revoked' | 'suspended'
  clerkMembershipID?: null | string
  payload: Payload
  req: PayloadRequest
  roleTemplate: OrganizationMembershipRoleTemplate
  targetUser: User
}): Promise<OrganizationMembership> {
  const organization = await ensureDefaultStaffOrganization(args.payload, args.req)
  const existingMembership = await getUserOrganizationMembership(args.payload, {
    organizationId: Number(organization.id),
    req: args.req,
    userId: Number(args.targetUser.id),
  })
  const syncSource = args.clerkMembershipID ? 'clerk' : existingMembership?.syncSource || 'app'
  const nextStatus = args.status ?? 'active'

  if (existingMembership) {
    const updatedMembership = (await args.payload.update({
      collection: ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
      id: existingMembership.id,
      data: {
        clerkMembershipID: args.clerkMembershipID ?? existingMembership.clerkMembershipID,
        lastSyncedAt: new Date().toISOString(),
        roleTemplate: args.roleTemplate,
        status: nextStatus,
        syncSource,
      },
      overrideAccess: true,
      req: args.req,
    })) as OrganizationMembership

    await syncUserLegacyRolesFromMemberships(args.payload, Number(args.targetUser.id), {
      pendingMembership: updatedMembership,
    })

    return updatedMembership
  }

  const membership = (await args.payload.create({
    collection: ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
      data: {
        clerkMembershipID: args.clerkMembershipID,
        lastSyncedAt: new Date().toISOString(),
        organization: organization.id,
        roleTemplate: args.roleTemplate,
        status: nextStatus,
        syncSource,
        user: args.targetUser.id,
      },
      overrideAccess: true,
    req: args.req,
  })) as OrganizationMembership

  await syncUserLegacyRolesFromMemberships(args.payload, Number(args.targetUser.id), {
    pendingMembership: membership,
  })

  return membership
}

async function revokePendingInvitationByEmail(args: {
  email: string
  organizationId: string
}) {
  const client = await clerkClient()
  const invitations = await client.organizations.getOrganizationInvitationList({
    limit: 100,
    organizationId: args.organizationId,
    status: ['pending'],
  })
  const invitation = invitations.data.find(
    (item) => item.emailAddress.trim().toLowerCase() === args.email,
  )

  if (!invitation) {
    return false
  }

  await client.organizations.revokeOrganizationInvitation({
    invitationId: invitation.id,
    organizationId: args.organizationId,
  })

  return true
}

async function updateLocalStaffMembershipStatus(args: {
  payload: Payload
  req: PayloadRequest
  status: 'active' | 'suspended'
  targetUser: User
}): Promise<OrganizationMembership> {
  const organization = await ensureDefaultStaffOrganization(args.payload, args.req)
  const existingMembership = await getUserOrganizationMembership(args.payload, {
    organizationId: Number(organization.id),
    req: args.req,
    userId: Number(args.targetUser.id),
  })

  if (!existingMembership || !existingMembership.roleTemplate?.startsWith('staff-')) {
    throw new OpsStaffAdminError('No staff membership exists for that user yet.', 409)
  }

  if (existingMembership.status === args.status) {
    return existingMembership
  }

  const updatedMembership = (await args.payload.update({
    collection: ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG,
    id: existingMembership.id,
    data: {
      lastSyncedAt: new Date().toISOString(),
      status: args.status,
    },
    overrideAccess: true,
    req: args.req,
  })) as OrganizationMembership

  await syncUserLegacyRolesFromMemberships(args.payload, Number(args.targetUser.id), {
    pendingMembership: updatedMembership,
  })

  return updatedMembership
}

async function createOrUpdateClerkStaffAccess(args: {
  actingClerkUserId?: null | string
  email: string
  payload: Payload
  redirectUrl: string
  roleTemplate: OrganizationMembershipRoleTemplate
  targetUser: User
}) {
  const client = await clerkClient()
  const clerkRole = mapRoleTemplateToClerkRole(args.roleTemplate)

  if (args.targetUser.clerkUserID?.trim()) {
    const membershipsResponse = await client.users
      .getOrganizationMembershipList({
        limit: 100,
        userId: args.targetUser.clerkUserID,
      })
      .catch(() => ({ data: [] }))
    const existingMembership = membershipsResponse.data.find(
      (membership) => membership.organization.id === DEFAULT_GRIME_TIME_CLERK_ORG_ID,
    )

    if (existingMembership) {
      const updatedMembership = await client.organizations.updateOrganizationMembership({
        organizationId: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
        role: clerkRole,
        userId: args.targetUser.clerkUserID,
      })

      return {
        clerkMembershipID: updatedMembership.id,
        kind: 'membership' as const,
      }
    }

    const createdMembership = await client.organizations.createOrganizationMembership({
      organizationId: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
      role: clerkRole,
      userId: args.targetUser.clerkUserID,
    })

    return {
      clerkMembershipID: createdMembership.id,
      kind: 'membership' as const,
    }
  }

  await revokePendingInvitationByEmail({
    email: args.email,
    organizationId: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
  })

  const invitation = await client.organizations.createOrganizationInvitation({
    emailAddress: args.email,
    expiresInDays: DEFAULT_INVITE_EXPIRY_DAYS,
    inviterUserId: args.actingClerkUserId || undefined,
    organizationId: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
    redirectUrl: args.redirectUrl,
    role: clerkRole,
  })

  return {
    clerkInvitationId: invitation.id,
    expiresAt: new Date(invitation.expiresAt).toISOString(),
    kind: 'invitation' as const,
  }
}

export async function performOpsUserAdminAction(args: {
  action: OpsUserAdminAction
  actor: User
  payload: Payload
  targetUserId: number
}) {
  const req = await createLocalReq({ user: args.actor }, args.payload)
  const targetUser = await loadTargetUser(args.payload, args.targetUserId)
  const targetEmail = normalizeEmail(targetUser.email)

  if (!targetEmail) {
    throw new OpsStaffAdminError('That user does not have an email address yet.', 409)
  }

  if (args.action.action === 'resync_provider') {
    if (!targetUser.clerkUserID?.trim()) {
      throw new OpsStaffAdminError('This user does not have a Clerk identity to resync yet.', 409)
    }

    const client = await clerkClient()
    const membershipsResponse = await client.users
      .getOrganizationMembershipList({
        limit: 100,
        userId: targetUser.clerkUserID,
      })
      .catch(() => ({ data: [] }))

    await ensureBootstrapOrganizationMembership(args.payload, targetUser, {
      clerkMemberships: membershipsResponse.data.map((membership) => ({
        clerkMembershipID: membership.id,
        clerkOrgID: membership.organization.id,
        role: membership.role || null,
      })),
    })

    return { message: 'Provider membership data refreshed from Clerk.' }
  }

  if (args.action.action === 'revoke_staff_invite') {
    const revoked = await revokePendingInvitationByEmail({
      email: targetEmail,
      organizationId: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
    })

    await updateUserInviteState({
      payload: args.payload,
      req,
      state: 'none',
      targetUserId: args.targetUserId,
    })

    return {
      message: revoked
        ? 'Pending staff invite revoked.'
        : 'No pending Clerk invite was found, but the local invite state was cleared.',
    }
  }

  if (args.action.action === 'suspend_staff_access') {
    const membership = await updateLocalStaffMembershipStatus({
      payload: args.payload,
      req,
      status: 'suspended',
      targetUser,
    })

    return {
      message:
        membership.status === 'suspended'
          ? 'Staff access suspended. App-owned entitlements are now locked.'
          : 'Staff membership was already suspended.',
    }
  }

  if (args.action.action === 'reactivate_staff_access') {
    const membership = await updateLocalStaffMembershipStatus({
      payload: args.payload,
      req,
      status: 'active',
      targetUser,
    })

    return {
      message:
        membership.status === 'active'
          ? 'Staff access restored from the app-owned membership.'
          : 'Staff membership was already active.',
    }
  }

  const roleTemplate = args.action.roleTemplate
  const membership = await upsertLocalStaffMembership({
    payload: args.payload,
    req,
    roleTemplate,
    targetUser,
  })

  if (args.action.action === 'update_staff_role') {
    if (targetUser.clerkUserID?.trim() && membership.clerkMembershipID?.trim()) {
      const client = await clerkClient()
      await client.organizations.updateOrganizationMembership({
        organizationId: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
        role: mapRoleTemplateToClerkRole(roleTemplate),
        userId: targetUser.clerkUserID,
      })
    }

    return { message: 'Staff role template updated.' }
  }

  const redirectUrl = new URL(OPS_DASHBOARD_PATH, getServerSideURL()).toString()
  const result = await createOrUpdateClerkStaffAccess({
    actingClerkUserId: args.actor.clerkUserID,
    email: targetEmail,
    payload: args.payload,
    redirectUrl,
    roleTemplate,
    targetUser,
  })

  if (result.kind === 'membership') {
    await upsertLocalStaffMembership({
      clerkMembershipID: result.clerkMembershipID,
      payload: args.payload,
      req,
      roleTemplate,
      targetUser,
    })
    await updateUserInviteState({
      payload: args.payload,
      req,
      state: 'active',
      targetUserId: args.targetUserId,
    })

    return { message: 'Staff membership granted and synced with Clerk.' }
  }

  await updateUserInviteState({
    payload: args.payload,
    req,
    sentAt: new Date().toISOString(),
    state: 'invite_pending',
    targetUserId: args.targetUserId,
  })

  return { message: 'Staff invite sent through Clerk.' }
}
