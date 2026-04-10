import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireRequestAuth = vi.fn()
const performOpsCustomerAdminAction = vi.fn()

vi.mock('@/lib/auth/requirePayloadUser', () => ({
  requireRequestAuth,
}))

vi.mock('@/lib/ops/customerAdmin', () => ({
  OpsCustomerAdminError: class OpsCustomerAdminError extends Error {
    status: number

    constructor(message: string, status = 400) {
      super(message)
      this.status = status
    }
  },
  performOpsCustomerAdminAction,
}))

describe('ops customers route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects non-admin callers', async () => {
    requireRequestAuth.mockResolvedValue({
      isRealAdmin: false,
    })

    const { POST } = await import('@/app/api/internal/ops/customers/[id]/route')
    const response = await POST(new Request('http://localhost/api/internal/ops/customers/7', {
      body: JSON.stringify({ action: 'repair_stripe_customer' }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }), {
      params: Promise.resolve({ id: '7' }),
    })

    expect(response.status).toBe(401)
    expect(performOpsCustomerAdminAction).not.toHaveBeenCalled()
  })

  it('passes validated customer actions into the app-owned customer admin service', async () => {
    const payload = {}
    const realUser = { id: 19 }

    requireRequestAuth.mockResolvedValue({
      isRealAdmin: true,
      payload,
      realUser,
    })
    performOpsCustomerAdminAction.mockResolvedValue({
      message: 'Primary customer updated for this account.',
    })

    const { POST } = await import('@/app/api/internal/ops/customers/[id]/route')
    const response = await POST(new Request('http://localhost/api/internal/ops/customers/41', {
      body: JSON.stringify({
        action: 'set_primary_customer',
        userId: 9,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }), {
      params: Promise.resolve({ id: '41' }),
    })

    expect(response.status).toBe(200)
    expect(performOpsCustomerAdminAction).toHaveBeenCalledWith({
      action: {
        action: 'set_primary_customer',
        userId: 9,
      },
      payload,
      targetAccountId: 41,
    })
  })

  it('accepts cleanup customer actions without extra payload fields', async () => {
    const payload = {}

    requireRequestAuth.mockResolvedValue({
      isRealAdmin: true,
      payload,
      realUser: { id: 19 },
    })
    performOpsCustomerAdminAction.mockResolvedValue({
      message: 'Stripe customer linkage cleared for this account.',
    })

    const { POST } = await import('@/app/api/internal/ops/customers/[id]/route')
    const response = await POST(new Request('http://localhost/api/internal/ops/customers/41', {
      body: JSON.stringify({
        action: 'clear_stripe_customer',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }), {
      params: Promise.resolve({ id: '41' }),
    })

    expect(response.status).toBe(200)
    expect(performOpsCustomerAdminAction).toHaveBeenCalledWith({
      action: {
        action: 'clear_stripe_customer',
      },
      payload,
      targetAccountId: 41,
    })
  })

  it('accepts Stripe resync customer actions with an optional linked user id', async () => {
    const payload = {}

    requireRequestAuth.mockResolvedValue({
      isRealAdmin: true,
      payload,
      realUser: { id: 19 },
    })
    performOpsCustomerAdminAction.mockResolvedValue({
      message: 'Stripe customer resynced as cus_invoice_123.',
    })

    const { POST } = await import('@/app/api/internal/ops/customers/[id]/route')
    const response = await POST(new Request('http://localhost/api/internal/ops/customers/41', {
      body: JSON.stringify({
        action: 'resync_stripe_customer',
        userId: 9,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }), {
      params: Promise.resolve({ id: '41' }),
    })

    expect(response.status).toBe(200)
    expect(performOpsCustomerAdminAction).toHaveBeenCalledWith({
      action: {
        action: 'resync_stripe_customer',
        userId: 9,
      },
      payload,
      targetAccountId: 41,
    })
  })
})
