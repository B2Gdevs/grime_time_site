import { beforeEach, describe, expect, it, vi } from 'vitest'

const requirePayloadUser = vi.fn()
const enforceCopilotRateLimit = vi.fn()
const isAiOpsAssistantEnabled = vi.fn()
const isAiOpsAssistantKilled = vi.fn()
const getAiOpsAssistantOpenAiKey = vi.fn()
const searchOpsRag = vi.fn()
const buildCopilotInsights = vi.fn()
const createCopilotChatCompletion = vi.fn()
const logCopilotAudit = vi.fn()

vi.mock('@/lib/auth/requirePayloadUser', () => ({
  requirePayloadUser,
}))

vi.mock('@/lib/auth/getCurrentPayloadUser', () => ({
  userIsAdmin: vi.fn((user: { roles?: string[] }) => Array.isArray(user.roles) && user.roles.includes('admin')),
}))

vi.mock('@/lib/ai', () => ({
  AI_OPS_ASSISTANT_INSTRUCTIONS: 'assistant instructions',
  buildCopilotInsights,
  buildOpsRagSystemMessage: vi.fn(() => 'rag context'),
  createCopilotChatCompletion,
  enforceCopilotRateLimit,
  getAiOpsAssistantModel: vi.fn(() => 'gpt-4o-mini'),
  getAiOpsAssistantOpenAiKey,
  isAiOpsAssistantEnabled,
  isAiOpsAssistantKilled,
  logCopilotAudit,
  searchOpsRag,
}))

describe('internal AI copilot route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    enforceCopilotRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 })
    isAiOpsAssistantKilled.mockReturnValue(false)
  })

  it('returns 503 when the feature flag is off', async () => {
    isAiOpsAssistantEnabled.mockReturnValue(false)

    const { POST } = await import('@/app/api/internal/ai/copilot/route')
    const response = await POST(
      new Request('http://localhost/api/internal/ai/copilot', {
        body: JSON.stringify({ messages: [{ content: 'hello', role: 'user' }] }),
        method: 'POST',
      }),
    )

    expect(response.status).toBe(503)
  })

  it('returns 503 when the kill switch is on', async () => {
    isAiOpsAssistantEnabled.mockReturnValue(true)
    isAiOpsAssistantKilled.mockReturnValue(true)

    const { POST } = await import('@/app/api/internal/ai/copilot/route')
    const response = await POST(
      new Request('http://localhost/api/internal/ai/copilot', {
        body: JSON.stringify({ messages: [{ content: 'hello', role: 'user' }] }),
        method: 'POST',
      }),
    )

    expect(response.status).toBe(503)
  })

  it('returns a grounded response for an authenticated admin', async () => {
    isAiOpsAssistantEnabled.mockReturnValue(true)
    getAiOpsAssistantOpenAiKey.mockReturnValue('sk-test')
    requirePayloadUser.mockResolvedValue({
      payload: {},
      realUser: { email: 'ops@grimetime.app', id: 7, name: 'Ops', roles: ['admin'] },
      user: { email: 'ops@grimetime.app', id: 7, name: 'Ops', roles: ['admin'] },
    })
    searchOpsRag.mockResolvedValue([
      {
        chunkId: 'a',
        content: 'Send the quote the same day.',
        heading: 'Quote follow-up',
        score: 0.91,
        slug: 'lead-to-customer-runbook',
        sourcePath: 'src/content/docs/lead-to-customer-runbook.md',
        title: 'Lead to customer runbook',
      },
    ])
    buildCopilotInsights.mockResolvedValue({
      followUps: [],
      operator: { email: 'ops@grimetime.app', isRealAdmin: true, name: 'Ops' },
      query: 'What should I do next?',
      recommendedTours: [],
      tasks: [],
    })
    createCopilotChatCompletion.mockResolvedValue('Start with the stale quote follow-up.')

    const { POST } = await import('@/app/api/internal/ai/copilot/route')
    const response = await POST(
      new Request('http://localhost/api/internal/ai/copilot', {
        body: JSON.stringify({ currentPath: '/ops', messages: [{ content: 'What should I do next?', role: 'user' }] }),
        method: 'POST',
      }),
    )

    expect(response.status).toBe(200)
    const data = (await response.json()) as { sources: Array<{ title: string }>; text: string }
    expect(data.text).toContain('stale quote follow-up')
    expect(data.sources[0]?.title).toBe('Lead to customer runbook')
  })

  it('returns 429 when the operator exceeds the rate limit', async () => {
    isAiOpsAssistantEnabled.mockReturnValue(true)
    getAiOpsAssistantOpenAiKey.mockReturnValue('sk-test')
    enforceCopilotRateLimit.mockReturnValue({ allowed: false, retryAfterSeconds: 42 })
    requirePayloadUser.mockResolvedValue({
      payload: {},
      realUser: { email: 'ops@grimetime.app', id: 7, name: 'Ops', roles: ['admin'] },
      user: { email: 'ops@grimetime.app', id: 7, name: 'Ops', roles: ['admin'] },
    })

    const { POST } = await import('@/app/api/internal/ai/copilot/route')
    const response = await POST(
      new Request('http://localhost/api/internal/ai/copilot', {
        body: JSON.stringify({ currentPath: '/ops', messages: [{ content: 'What next?', role: 'user' }] }),
        method: 'POST',
      }),
    )

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('42')
  })
})
