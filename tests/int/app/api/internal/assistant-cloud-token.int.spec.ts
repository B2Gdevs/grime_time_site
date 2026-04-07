import { beforeEach, describe, expect, it, vi } from 'vitest'

const requirePayloadUser = vi.fn()
const userIsAdmin = vi.fn()
const createAssistantCloudServerClient = vi.fn()
const getAssistantCloudBaseUrl = vi.fn()

vi.mock('@/lib/auth/requirePayloadUser', () => ({
  requirePayloadUser,
}))

vi.mock('@/lib/auth/getCurrentPayloadUser', () => ({
  userIsAdmin,
}))

vi.mock('@/lib/ai/assistantCloud', () => ({
  createAssistantCloudServerClient,
  getAssistantCloudBaseUrl,
}))

describe('assistant cloud token route', () => {
  beforeEach(() => {
    requirePayloadUser.mockReset()
    userIsAdmin.mockReset()
    createAssistantCloudServerClient.mockReset()
    getAssistantCloudBaseUrl.mockReset()
  })

  it('rejects unauthenticated requests', async () => {
    requirePayloadUser.mockResolvedValue(null)

    const { POST } = await import('@/app/api/internal/assistant-cloud/token/route')
    const response = await POST(new Request('http://localhost/api/internal/assistant-cloud/token', { method: 'POST' }))

    expect(response.status).toBe(401)
  })

  it('returns a token for an authenticated admin', async () => {
    requirePayloadUser.mockResolvedValue({
      realUser: { id: 7 },
      user: { id: 7 },
    })
    userIsAdmin.mockReturnValue(true)
    getAssistantCloudBaseUrl.mockReturnValue('https://proj-0tg4j0qwfdis.assistant-api.com')
    createAssistantCloudServerClient.mockReturnValue({
      auth: {
        tokens: {
          create: vi.fn().mockResolvedValue({ token: 'assistant-token' }),
        },
      },
    })

    const { POST } = await import('@/app/api/internal/assistant-cloud/token/route')
    const response = await POST(new Request('http://localhost/api/internal/assistant-cloud/token', { method: 'POST' }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ token: 'assistant-token' })
    expect(createAssistantCloudServerClient).toHaveBeenCalledWith('7')
  })
})

