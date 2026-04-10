import { beforeEach, describe, expect, it, vi } from 'vitest'

const issuePortalAccess = vi.fn()
const ensureStripeCustomer = vi.fn()

vi.mock('@/lib/auth/portal-access/claims', () => ({
  issuePortalAccess,
}))

vi.mock('@/lib/billing/stripe/customers', () => ({
  ensureStripeCustomer,
}))

describe('customerAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets the selected linked user as the primary customer', async () => {
    const payload = {
      findByID: vi.fn().mockImplementation(async ({ collection, id }) => {
        if (collection === 'accounts') {
          return { id, name: 'North Dock', customerUser: null }
        }

        return { id, account: 41, email: 'owner@northdock.com', portalInviteState: 'none' }
      }),
      update: vi.fn().mockResolvedValue({}),
    }

    const { performOpsCustomerAdminAction } = await import('@/lib/ops/customerAdmin')
    const result = await performOpsCustomerAdminAction({
      action: {
        action: 'set_primary_customer',
        userId: 9,
      },
      payload: payload as never,
      targetAccountId: 41,
    })

    expect(payload.update).toHaveBeenCalledWith({
      collection: 'accounts',
      id: 41,
      data: {
        customerUser: 9,
      },
      overrideAccess: true,
    })
    expect(result).toEqual({ message: 'Primary customer updated for this account.' })
  })

  it('clears the primary customer on the account without requiring a linked user payload', async () => {
    const payload = {
      findByID: vi.fn().mockResolvedValue({ id: 41, name: 'North Dock', customerUser: 9 }),
      update: vi.fn().mockResolvedValue({}),
    }

    const { performOpsCustomerAdminAction } = await import('@/lib/ops/customerAdmin')
    const result = await performOpsCustomerAdminAction({
      action: {
        action: 'clear_primary_customer',
      },
      payload: payload as never,
      targetAccountId: 41,
    })

    expect(payload.update).toHaveBeenCalledWith({
      collection: 'accounts',
      id: 41,
      data: {
        customerUser: null,
      },
      overrideAccess: true,
    })
    expect(result).toEqual({ message: 'Primary customer cleared for this account.' })
  })

  it('issues portal access for the selected linked user using the app-owned helper', async () => {
    const payload = {
      findByID: vi.fn().mockImplementation(async ({ collection, id }) => {
        if (collection === 'accounts') {
          return { id, name: 'North Dock', customerUser: null }
        }

        return {
          id,
          account: 41,
          email: 'owner@northdock.com',
          name: 'North Dock Owner',
          portalInviteState: 'invite_pending',
        }
      }),
    }

    const { performOpsCustomerAdminAction } = await import('@/lib/ops/customerAdmin')
    const result = await performOpsCustomerAdminAction({
      action: {
        action: 'send_portal_access',
        userId: 9,
      },
      payload: payload as never,
      targetAccountId: 41,
    })

    expect(issuePortalAccess).toHaveBeenCalledWith({
      accountName: 'North Dock',
      mode: 'invite',
      payload,
      user: expect.objectContaining({
        id: 9,
      }),
    })
    expect(result).toEqual({ message: 'Portal access email queued for the selected linked user.' })
  })

  it('clears the selected linked user portal-access state through the app-owned user record', async () => {
    const payload = {
      findByID: vi.fn().mockImplementation(async ({ collection, id }) => {
        if (collection === 'accounts') {
          return { id, name: 'North Dock', customerUser: null }
        }

        return {
          id,
          account: 41,
          email: 'owner@northdock.com',
          name: 'North Dock Owner',
          portalInviteState: 'active',
        }
      }),
      update: vi.fn().mockResolvedValue({}),
    }

    const { performOpsCustomerAdminAction } = await import('@/lib/ops/customerAdmin')
    const result = await performOpsCustomerAdminAction({
      action: {
        action: 'clear_portal_access',
        userId: 9,
      },
      payload: payload as never,
      targetAccountId: 41,
    })

    expect(payload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 9,
      data: {
        lastPortalLoginAt: null,
        portalInviteExpiresAt: null,
        portalInviteSentAt: null,
        portalInviteState: 'none',
        portalInviteTokenHash: null,
      },
      overrideAccess: true,
    })
    expect(result).toEqual({ message: 'Portal access state cleared for the selected linked user.' })
  })

  it('repairs the Stripe customer link using the selected linked user when available', async () => {
    const payload = {
      findByID: vi.fn().mockImplementation(async ({ collection, id }) => {
        if (collection === 'accounts') {
          return { id, name: 'North Dock', customerUser: null, stripeCustomerID: null }
        }

        return {
          id,
          account: 41,
          email: 'owner@northdock.com',
          name: 'North Dock Owner',
          portalInviteState: 'active',
        }
      }),
    }
    ensureStripeCustomer.mockResolvedValue('cus_123')

    const { performOpsCustomerAdminAction } = await import('@/lib/ops/customerAdmin')
    const result = await performOpsCustomerAdminAction({
      action: {
        action: 'repair_stripe_customer',
        userId: 9,
      },
      payload: payload as never,
      targetAccountId: 41,
    })

    expect(ensureStripeCustomer).toHaveBeenCalledWith({
      account: expect.objectContaining({
        id: 41,
      }),
      payload,
      user: expect.objectContaining({
        id: 9,
      }),
    })
    expect(result).toEqual({ message: 'Stripe customer linked as cus_123.' })
  })

  it('clears the stored Stripe linkage from the account before any later repair pass', async () => {
    const payload = {
      findByID: vi.fn().mockResolvedValue({
        id: 41,
        name: 'North Dock',
        customerUser: null,
        stripeCustomerID: 'cus_123',
      }),
      update: vi.fn().mockResolvedValue({}),
    }

    const { performOpsCustomerAdminAction } = await import('@/lib/ops/customerAdmin')
    const result = await performOpsCustomerAdminAction({
      action: {
        action: 'clear_stripe_customer',
      },
      payload: payload as never,
      targetAccountId: 41,
    })

    expect(payload.update).toHaveBeenCalledWith({
      collection: 'accounts',
      id: 41,
      data: {
        billingPortalLastSharedAt: null,
        stripeCustomerID: null,
        stripeDefaultPaymentMethodID: null,
      },
      overrideAccess: true,
    })
    expect(result).toEqual({ message: 'Stripe customer linkage cleared for this account.' })
  })
})
