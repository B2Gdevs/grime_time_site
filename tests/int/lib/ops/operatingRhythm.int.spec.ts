import { describe, expect, it } from 'vitest'

import { buildOperatingRhythmPolicy } from '@/lib/ops/policies/operatingRhythm'

describe('operating rhythm policy', () => {
  it('moves after-hours lead SLA targets to the next business morning window', () => {
    const policy = buildOperatingRhythmPolicy({
      now: new Date('2026-03-27T23:15:00.000Z'),
      rule: {
        acknowledgmentBusinessMinutes: 10,
        escalationBusinessDays: 1,
        nextAction: 'Reply to new lead.',
        priority: 'high',
        roleTags: ['lead-followup'],
        slaClass: 'new_lead',
        sourceType: 'lead',
        staleBusinessDays: 1,
      },
    })

    expect(new Date(policy.slaTargetAt).getUTCHours()).toBe(8)
    expect(new Date(policy.slaTargetAt).getUTCMinutes()).toBe(40)
  })

  it('keeps business-day escalations on weekdays', () => {
    const policy = buildOperatingRhythmPolicy({
      now: new Date('2026-03-27T15:00:00.000Z'),
      rule: {
        acknowledgmentBusinessDays: 1,
        escalationBusinessDays: 1,
        nextAction: 'Review refund request.',
        priority: 'urgent',
        roleTags: ['billing-followup', 'ops-admin'],
        slaClass: 'refund_request',
        sourceType: 'support',
        staleBusinessDays: 1,
      },
    })

    const escalationDay = new Date(policy.escalatesAt).getUTCDay()
    expect([1, 2, 3, 4, 5]).toContain(escalationDay)
  })
})

