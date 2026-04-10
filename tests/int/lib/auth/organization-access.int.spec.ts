import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'
import type { Organization, OrganizationMembership, User } from '@/payload-types'
import { DEFAULT_GRIME_TIME_CLERK_ORG_ID } from '@/lib/auth/organizationConstants'

const runKey = `organization-access-${Date.now()}`
const created: Array<{ collection: string; id: number | string }> = []

let payload: Payload

async function createUser(data: Record<string, unknown>) {
  const user = (await payload.create({
    collection: 'users',
    data,
    overrideAccess: true,
  } as never)) as User

  created.push({ collection: 'users', id: user.id })
  return user
}

async function createOrganization(data: Record<string, unknown>) {
  const organization = (await payload.create({
    collection: 'organizations',
    data,
    overrideAccess: true,
  } as never)) as Organization

  created.push({ collection: 'organizations', id: organization.id })
  return organization
}

async function createMembership(data: Record<string, unknown>) {
  const membership = (await payload.create({
    collection: 'organization-memberships',
    data,
    overrideAccess: true,
  } as never)) as OrganizationMembership

  created.push({ collection: 'organization-memberships', id: membership.id })
  return membership
}

describe('organizationAccess', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    for (const entry of created.reverse()) {
      await payload.delete({
        collection: entry.collection as never,
        id: entry.id,
        overrideAccess: true,
      })
    }
  })

  it(
    'grants payload-admin access from an active staff-admin membership and syncs the legacy admin role',
    { timeout: 15000 },
    async () => {
      const user = await createUser({
        email: `${runKey}.staff@example.com`,
        name: 'Staff Admin',
        password: 'test-password',
        roles: ['customer'],
      })

      const organization = await createOrganization({
        clerkOrgID: `${runKey}-clerk-org`,
        kind: 'staff',
        name: `Ops ${runKey}`,
        provider: 'app',
        slug: `ops-${runKey}`,
        status: 'active',
        syncSource: 'app',
      })

      await createMembership({
        organization: organization.id,
        roleTemplate: 'staff-admin',
        status: 'active',
        syncSource: 'app',
        user: user.id,
      })

      const {
        hasPayloadAdminAccess,
        resolveUserOrganizationAccess,
        syncUserLegacyRolesFromMemberships,
      } = await import(
        '@/lib/auth/organizationAccess'
      )
      await syncUserLegacyRolesFromMemberships(payload, Number(user.id))
      const access = await resolveUserOrganizationAccess(payload, user)
      const reloadedUser = (await payload.findByID({
        collection: 'users',
        depth: 0,
        id: user.id,
        overrideAccess: true,
      })) as User

      expect(access.hasPayloadAdminAccess).toBe(true)
      expect(access.canManageOrganizations).toBe(false)
      expect(access.canManageMemberships).toBe(true)
      expect(await hasPayloadAdminAccess(payload, reloadedUser)).toBe(true)
      expect(reloadedUser.roles).toEqual(expect.arrayContaining(['admin']))
    },
  )

  it(
    'bootstraps the default Grime Time staff organization and membership for internal users',
    { timeout: 15000 },
    async () => {
      const previousAdminEmail = process.env.ADMIN_EMAIL
      const bootstrapEmail = `${runKey}.owner@grimetime.app`
      process.env.ADMIN_EMAIL = bootstrapEmail

      try {
        const user = await createUser({
          email: bootstrapEmail,
          name: 'Bootstrap Owner',
          password: 'test-password',
          roles: ['customer'],
        })

        const existingOrgResult = await payload.find({
          collection: 'organizations',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          where: {
            clerkOrgID: {
              equals: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
            },
          },
        })
        const hadDefaultOrganization = Boolean(existingOrgResult.docs[0])

        const { ensureBootstrapOrganizationMembership } = await import(
          '@/lib/auth/organizationSync'
        )
        const membership = await ensureBootstrapOrganizationMembership(payload, user)

        expect(membership?.roleTemplate).toBe('staff-owner')

        const defaultOrganization = (await payload.find({
          collection: 'organizations',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          where: {
            clerkOrgID: {
              equals: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
            },
          },
        })) as { docs: Organization[] }

        expect(defaultOrganization.docs[0]?.slug).toBe('grime-time')

        const reloadedUser = (await payload.findByID({
          collection: 'users',
          depth: 0,
          id: user.id,
          overrideAccess: true,
        })) as User

        expect(reloadedUser.roles).toEqual(expect.arrayContaining(['admin']))

        if (membership?.id) {
          created.push({ collection: 'organization-memberships', id: membership.id })
        }

        if (!hadDefaultOrganization && defaultOrganization.docs[0]?.id) {
          created.push({ collection: 'organizations', id: defaultOrganization.docs[0].id })
        }
      } finally {
        process.env.ADMIN_EMAIL = previousAdminEmail
      }
    },
  )

  it(
    'bootstraps a designer-grade staff membership from Clerk org membership for non-domain emails',
    { timeout: 15000 },
    async () => {
      const user = await createUser({
        email: `${runKey}.google-user@example.com`,
        name: 'Google Staffer',
        password: 'test-password',
        roles: ['customer'],
      })

      const existingOrgResult = await payload.find({
        collection: 'organizations',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          clerkOrgID: {
            equals: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
          },
        },
      })
      const hadDefaultOrganization = Boolean(existingOrgResult.docs[0])

      const { ensureBootstrapOrganizationMembership } = await import(
        '@/lib/auth/organizationSync'
      )
      const membership = await ensureBootstrapOrganizationMembership(payload, user, {
        clerkMemberships: [
          {
            clerkMembershipID: `${runKey}-mem-1`,
            clerkOrgID: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
            role: 'org:member',
          },
        ],
      })
      const { hasContentAuthoringAccess, hasPayloadAdminAccess } = await import(
        '@/lib/auth/organizationAccess'
      )

      expect(membership?.roleTemplate).toBe('staff-designer')
      expect(membership?.syncSource).toBe('clerk')
      expect(membership?.clerkMembershipID).toBe(`${runKey}-mem-1`)

      const reloadedUser = (await payload.findByID({
        collection: 'users',
        depth: 0,
        id: user.id,
        overrideAccess: true,
      })) as User

      expect(await hasContentAuthoringAccess(payload, reloadedUser)).toBe(true)
      expect(await hasPayloadAdminAccess(payload, reloadedUser)).toBe(false)
      expect(reloadedUser.roles).toEqual(expect.not.arrayContaining(['admin']))

      if (membership?.id) {
        created.push({ collection: 'organization-memberships', id: membership.id })
      }

      const defaultOrganization = (await payload.find({
        collection: 'organizations',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          clerkOrgID: {
            equals: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
          },
        },
      })) as { docs: Organization[] }

      if (!hadDefaultOrganization && defaultOrganization.docs[0]?.id) {
        created.push({ collection: 'organizations', id: defaultOrganization.docs[0].id })
      }
    },
  )

  it(
    'preserves an existing first-party staff role when Clerk membership sync attaches the provider id',
    { timeout: 15000 },
    async () => {
      const user = await createUser({
        email: `${runKey}.operator@example.com`,
        name: 'Field Operator',
        password: 'test-password',
        roles: ['customer'],
      })

      const existingOrgResult = await payload.find({
        collection: 'organizations',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          clerkOrgID: {
            equals: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
          },
        },
      })
      const hadDefaultOrganization = Boolean(existingOrgResult.docs[0])
      const { ensureDefaultStaffOrganization, ensureBootstrapOrganizationMembership } = await import(
        '@/lib/auth/organizationSync'
      )
      const { createLocalReq } = await import('payload')
      const req = await createLocalReq({ user }, payload)
      const organization = await ensureDefaultStaffOrganization(payload, req)
      const existingMembership = await createMembership({
        organization: organization.id,
        roleTemplate: 'staff-operator',
        status: 'active',
        syncSource: 'app',
        user: user.id,
      })

      const syncedMembership = await ensureBootstrapOrganizationMembership(payload, user, {
        clerkMemberships: [
          {
            clerkMembershipID: `${runKey}-mem-operator`,
            clerkOrgID: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
            role: 'org:member',
          },
        ],
      })

      expect(syncedMembership?.id).toBe(existingMembership.id)
      expect(syncedMembership?.roleTemplate).toBe('staff-operator')
      expect(syncedMembership?.clerkMembershipID).toBe(`${runKey}-mem-operator`)
      expect(syncedMembership?.syncSource).toBe('clerk')

      const reloadedUser = (await payload.findByID({
        collection: 'users',
        depth: 0,
        id: user.id,
        overrideAccess: true,
      })) as User

      expect(reloadedUser.roles).toEqual(expect.not.arrayContaining(['admin']))

      const defaultOrganization = (await payload.find({
        collection: 'organizations',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          clerkOrgID: {
            equals: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
          },
        },
      })) as { docs: Organization[] }

      if (!hadDefaultOrganization && defaultOrganization.docs[0]?.id) {
        created.push({ collection: 'organizations', id: defaultOrganization.docs[0].id })
      }
    },
  )

  it(
    'preserves a suspended first-party staff membership when Clerk sync refreshes provider linkage',
    { timeout: 15000 },
    async () => {
      const user = await createUser({
        email: `${runKey}.suspended@example.com`,
        name: 'Suspended Operator',
        password: 'test-password',
        roles: ['customer'],
      })

      const existingOrgResult = await payload.find({
        collection: 'organizations',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          clerkOrgID: {
            equals: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
          },
        },
      })
      const hadDefaultOrganization = Boolean(existingOrgResult.docs[0])
      const { ensureDefaultStaffOrganization, ensureBootstrapOrganizationMembership } = await import(
        '@/lib/auth/organizationSync'
      )
      const { createLocalReq } = await import('payload')
      const req = await createLocalReq({ user }, payload)
      const organization = await ensureDefaultStaffOrganization(payload, req)

      await createMembership({
        organization: organization.id,
        roleTemplate: 'staff-admin',
        status: 'suspended',
        syncSource: 'app',
        user: user.id,
      })

      const syncedMembership = await ensureBootstrapOrganizationMembership(payload, user, {
        clerkMemberships: [
          {
            clerkMembershipID: `${runKey}-mem-suspended`,
            clerkOrgID: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
            role: 'org:admin',
          },
        ],
      })
      const { resolveUserOrganizationAccess, syncUserLegacyRolesFromMemberships } = await import(
        '@/lib/auth/organizationAccess'
      )

      await syncUserLegacyRolesFromMemberships(payload, Number(user.id), {
        pendingMembership: syncedMembership ?? null,
      })

      const reloadedUser = (await payload.findByID({
        collection: 'users',
        depth: 0,
        id: user.id,
        overrideAccess: true,
      })) as User
      const access = await resolveUserOrganizationAccess(payload, reloadedUser)

      expect(syncedMembership?.status).toBe('suspended')
      expect(syncedMembership?.roleTemplate).toBe('staff-admin')
      expect(syncedMembership?.clerkMembershipID).toBe(`${runKey}-mem-suspended`)
      expect(access.hasPayloadAdminAccess).toBe(false)
      expect(access.entitlements).not.toContain('admin:payload')
      expect(reloadedUser.roles).toEqual(expect.not.arrayContaining(['admin']))

      const defaultOrganization = (await payload.find({
        collection: 'organizations',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          clerkOrgID: {
            equals: DEFAULT_GRIME_TIME_CLERK_ORG_ID,
          },
        },
      })) as { docs: Organization[] }

      if (!hadDefaultOrganization && defaultOrganization.docs[0]?.id) {
        created.push({ collection: 'organizations', id: defaultOrganization.docs[0].id })
      }
    },
  )
})
