import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('AI copilot audit logging', () => {
  const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    infoSpy.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('logs a sanitized audit payload without the raw query body', async () => {
    vi.stubEnv('AI_OPS_ASSISTANT_AUDIT_LOGGING', 'true')

    const { logCopilotAudit } = await import('@/lib/ai/audit')

    logCopilotAudit({
      currentPath: '/ops/workspace',
      event: 'copilot_completed',
      query: 'Call Mike at 555-0101 about the dock quote',
      sourceCount: 2,
      userEmail: 'ops@grimetime.app',
      userId: 7,
    })

    expect(infoSpy).toHaveBeenCalledTimes(1)
    const [, serialized] = infoSpy.mock.calls[0] ?? []
    const payload = JSON.parse(String(serialized)) as Record<string, unknown>

    expect(payload.queryHash).toBeTypeOf('string')
    expect(payload.queryHash).not.toBe('')
    expect(payload).not.toHaveProperty('query')
    expect(String(serialized)).not.toContain('555-0101')
    expect(String(serialized)).not.toContain('dock quote')
  })

  it('can disable audit logging entirely through env', async () => {
    vi.stubEnv('AI_OPS_ASSISTANT_AUDIT_LOGGING', 'false')

    const { logCopilotAudit } = await import('@/lib/ai/audit')

    logCopilotAudit({
      event: 'copilot_blocked_disabled',
    })

    expect(infoSpy).not.toHaveBeenCalled()
  })
})
