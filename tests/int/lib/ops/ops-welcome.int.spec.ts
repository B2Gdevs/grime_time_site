import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('ops welcome preference helper', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns false when no welcome preference exists', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [] }),
    }

    const { hasSeenOpsWelcome } = await import('@/lib/ops/welcome')

    await expect(hasSeenOpsWelcome(payload as never, 17)).resolves.toBe(false)
    expect(payload.find).toHaveBeenCalled()
  })

  it('returns true when a matching preference has a dismissed timestamp', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            id: 4,
            key: 'ops-welcome-v1',
            user: { relationTo: 'users', value: 17 },
            value: { dismissedAt: '2026-04-09T00:00:00.000Z', seen: true },
          },
        ],
      }),
    }

    const { hasSeenOpsWelcome } = await import('@/lib/ops/welcome')

    await expect(hasSeenOpsWelcome(payload as never, 17)).resolves.toBe(true)
  })

  it('updates an existing preference when marking welcome seen', async () => {
    const payload = {
      create: vi.fn(),
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            id: 9,
            key: 'ops-welcome-v1',
            user: { relationTo: 'users', value: 17 },
            value: null,
          },
        ],
      }),
      update: vi.fn().mockResolvedValue({}),
    }

    const { markOpsWelcomeSeen, OPS_WELCOME_PREFERENCE_KEY } = await import('@/lib/ops/welcome')

    await markOpsWelcomeSeen(payload as never, 17)

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'payload-preferences',
        data: expect.objectContaining({
          key: OPS_WELCOME_PREFERENCE_KEY,
          user: { relationTo: 'users', value: 17 },
          value: expect.objectContaining({
            seen: true,
          }),
        }),
        id: 9,
      }),
    )
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('creates a preference when none exists yet', async () => {
    const payload = {
      create: vi.fn().mockResolvedValue({}),
      find: vi.fn().mockResolvedValue({ docs: [] }),
      update: vi.fn(),
    }

    const { markOpsWelcomeSeen, OPS_WELCOME_PREFERENCE_KEY } = await import('@/lib/ops/welcome')

    await markOpsWelcomeSeen(payload as never, 17)

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'payload-preferences',
        data: expect.objectContaining({
          key: OPS_WELCOME_PREFERENCE_KEY,
          user: { relationTo: 'users', value: 17 },
          value: expect.objectContaining({
            seen: true,
          }),
        }),
      }),
    )
    expect(payload.update).not.toHaveBeenCalled()
  })
})
