import { beforeEach, describe, expect, it, vi } from 'vitest'

const createLocalReq = vi.fn()
const ensureBootstrapOrganizationMembership = vi.fn()
const ensureDefaultStaffOrganization = vi.fn()
const getUserOrganizationMembership = vi.fn()
const syncUserLegacyRolesFromMemberships = vi.fn()

vi.mock('payload', () => ({
  createLocalReq,
}))

vi.mock('@/lib/auth/organizationAccess', () => ({
  getUserOrganizationMembership,
  syncUserLegacyRolesFromMemberships,
}))

vi.mock('@/lib/auth/organizationSync', () => ({
  ensureBootstrapOrganizationMembership,
  ensureDefaultStaffOrganization,
}))

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: vi.fn(),
}))

describe('staffAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createLocalReq.mockResolvedValue({ id: 'req-local' })
    ensureDefaultStaffOrganization.mockResolvedValue({ id: 77 })
  })

  it('locks a baseline entitlement on the active staff membership', async () => {
    const payload = {
      findByID: vi.fn().mockResolvedValue({
        clerkUserID: 'user_41',
        email: 'operator@grimetime.app',
        id: 41,
        name: 'Field Operator',
      }),
      update: vi.fn().mockResolvedValue({
        entitlementLocks: ['content:write'],
        id: 91,
        roleTemplate: 'staff-admin',
        status: 'active',
      }),
    }

    getUserOrganizationMembership.mockResolvedValue({
      entitlementLocks: [],
      id: 91,
      roleTemplate: 'staff-admin',
      status: 'active',
    })

    const { performOpsUserAdminAction } = await import('@/lib/ops/staffAdmin')
    const result = await performOpsUserAdminAction({
      action: {
        action: 'lock_staff_entitlement',
        entitlement: 'content:write',
      },
      actor: { id: 7 } as never,
      payload: payload as never,
      targetUserId: 41,
    })

    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'organization-memberships',
      data: expect.objectContaining({
        entitlementLocks: ['content:write'],
      }),
      id: 91,
      overrideAccess: true,
    }))
    expect(syncUserLegacyRolesFromMemberships).toHaveBeenCalled()
    expect(result).toEqual({ message: 'Locked content:write for this staff membership.' })
  })

  it('unlocks a baseline entitlement on the active staff membership', async () => {
    const payload = {
      findByID: vi.fn().mockResolvedValue({
        clerkUserID: 'user_41',
        email: 'operator@grimetime.app',
        id: 41,
        name: 'Field Operator',
      }),
      update: vi.fn().mockResolvedValue({
        entitlementLocks: [],
        id: 91,
        roleTemplate: 'staff-admin',
        status: 'active',
      }),
    }

    getUserOrganizationMembership.mockResolvedValue({
      entitlementLocks: ['content:write'],
      id: 91,
      roleTemplate: 'staff-admin',
      status: 'active',
    })

    const { performOpsUserAdminAction } = await import('@/lib/ops/staffAdmin')
    const result = await performOpsUserAdminAction({
      action: {
        action: 'unlock_staff_entitlement',
        entitlement: 'content:write',
      },
      actor: { id: 7 } as never,
      payload: payload as never,
      targetUserId: 41,
    })

    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'organization-memberships',
      data: expect.objectContaining({
        entitlementLocks: [],
      }),
      id: 91,
      overrideAccess: true,
    }))
    expect(syncUserLegacyRolesFromMemberships).toHaveBeenCalled()
    expect(result).toEqual({ message: 'Unlocked content:write for this staff membership.' })
  })
})
