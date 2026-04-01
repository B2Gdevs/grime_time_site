import { describe, expect, it, vi } from 'vitest'

const { enrollSequenceTrigger } = vi.hoisted(() => ({
  enrollSequenceTrigger: vi.fn(async () => undefined),
}))

vi.mock('@/lib/automation/sequences/enroll', () => ({
  enrollSequenceTrigger,
}))

import { afterLeadAutomation } from '@/hooks/afterLeadAutomation'

describe('afterLeadAutomation', () => {
  it('queues customer and employee notifications on lead create', async () => {
    const queue = vi.fn(async () => undefined)

    await afterLeadAutomation({
      doc: {
        account: 1,
        contact: 2,
        id: 14,
        owner: 9,
        title: 'Jamie - house wash',
      },
      operation: 'create',
      req: {
        payload: {
          jobs: {
            queue,
          },
        },
      },
    } as never)

    expect(queue).toHaveBeenCalledTimes(2)
    expect(queue).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        input: {
          leadId: '14',
          type: 'lead_acknowledgement',
        },
        queue: 'customer-notifications',
        task: 'sendCustomerNotification',
      }),
    )
    expect(queue).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        input: {
          leadId: '14',
          type: 'lead_created',
        },
        queue: 'employee-notifications',
        task: 'sendEmployeeNotification',
      }),
    )
    expect(enrollSequenceTrigger).toHaveBeenCalledTimes(1)
  })

  it('queues an employee notification when a lead owner changes', async () => {
    const queue = vi.fn(async () => undefined)

    await afterLeadAutomation({
      doc: {
        id: 18,
        owner: 12,
      },
      operation: 'update',
      previousDoc: {
        id: 18,
        owner: 7,
      },
      req: {
        payload: {
          jobs: {
            queue,
          },
        },
      },
    } as never)

    expect(queue).toHaveBeenCalledTimes(1)
    expect(queue).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          leadId: '18',
          type: 'lead_owner_reassigned',
        },
        queue: 'employee-notifications',
        task: 'sendEmployeeNotification',
      }),
    )
  })
})
