import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireRequestAuth = vi.fn()
const performOpsUserAdminAction = vi.fn()

vi.mock('@/lib/auth/requirePayloadUser', () => ({
  requireRequestAuth,
}))

vi.mock('@/lib/ops/staffAdmin', () => ({
  OpsStaffAdminError: class OpsStaffAdminError extends Error {
    status: number

    constructor(message: string, status = 400) {
      super(message)
      this.status = status
    }
  },
  performOpsUserAdminAction,
}))

describe('ops users route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects non-admin callers', async () => {
    requireRequestAuth.mockResolvedValue({
      isRealAdmin: false,
    })

    const { POST } = await import('@/app/api/internal/ops/users/[id]/route')
    const response = await POST(new Request('http://localhost/api/internal/ops/users/7', {
      body: JSON.stringify({ action: 'resync_provider' }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }), {
      params: Promise.resolve({ id: '7' }),
    })

    expect(response.status).toBe(401)
    expect(performOpsUserAdminAction).not.toHaveBeenCalled()
  })

  it('passes validated user actions into the app-owned staff admin service', async () => {
    const payload = {}
    const realUser = { id: 19 }

    requireRequestAuth.mockResolvedValue({
      isRealAdmin: true,
      payload,
      realUser,
    })
    performOpsUserAdminAction.mockResolvedValue({
      message: 'Staff invite sent through Clerk.',
    })

    const { POST } = await import('@/app/api/internal/ops/users/[id]/route')
    const response = await POST(new Request('http://localhost/api/internal/ops/users/41', {
      body: JSON.stringify({
        action: 'send_staff_invite',
        roleTemplate: 'staff-operator',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }), {
      params: Promise.resolve({ id: '41' }),
    })

    expect(response.status).toBe(200)
    expect(performOpsUserAdminAction).toHaveBeenCalledWith({
      action: {
        action: 'send_staff_invite',
        roleTemplate: 'staff-operator',
      },
      actor: realUser,
      payload,
      targetUserId: 41,
    })
    await expect(response.json()).resolves.toEqual({
      message: 'Staff invite sent through Clerk.',
    })
  })
})
