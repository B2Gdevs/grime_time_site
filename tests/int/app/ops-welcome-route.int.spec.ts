import { beforeEach, describe, expect, it, vi } from 'vitest'

const getCurrentAuthContext = vi.fn()
const markOpsWelcomeSeen = vi.fn()

vi.mock('@/lib/auth/getAuthContext', () => ({
  getCurrentAuthContext,
}))

vi.mock('@/lib/ops/welcome', () => ({
  markOpsWelcomeSeen,
}))

describe('ops welcome route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects non-admin users', async () => {
    getCurrentAuthContext.mockResolvedValue({
      isRealAdmin: false,
      realUser: { id: 7 },
    })

    const { POST } = await import('@/app/api/internal/ops/welcome/route')
    const response = await POST()

    expect(response.status).toBe(401)
    expect(markOpsWelcomeSeen).not.toHaveBeenCalled()
  })

  it('stores the dismissed welcome state for real admins', async () => {
    const payload = {}

    getCurrentAuthContext.mockResolvedValue({
      isRealAdmin: true,
      payload,
      realUser: { id: 17 },
    })

    const { POST } = await import('@/app/api/internal/ops/welcome/route')
    const response = await POST()

    expect(response.status).toBe(200)
    expect(markOpsWelcomeSeen).toHaveBeenCalledWith(payload, 17)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })
})
