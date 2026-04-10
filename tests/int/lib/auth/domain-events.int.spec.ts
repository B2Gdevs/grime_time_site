import { describe, expect, it, vi } from 'vitest'

describe('domainEvents', () => {
  it('writes app-owned auth domain events to the CRM activity sink', async () => {
    const payload = {
      create: vi.fn().mockResolvedValue({ id: 1 }),
    }

    const { createAuthDomainEvent } = await import('@/lib/auth/domainEvents')
    await createAuthDomainEvent({
      actorId: 7,
      details: {
        entitlement: 'content:write',
      },
      eventLabel: 'Locked content:write for operator@grimetime.app',
      eventType: 'membership_entitlement_locked',
      payload: payload as never,
      targetUserId: 41,
    })

    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'crm-activities',
      data: expect.objectContaining({
        activityType: 'system',
        direction: 'system',
        owner: 7,
        title: 'Locked content:write for operator@grimetime.app',
      }),
      overrideAccess: true,
    }))
  })
})
