import type { PayloadRequest, TaskConfig } from 'payload'

import { EMPLOYEE_NOTIFICATION_TYPES } from '@/lib/automation/employee-notifications/constants'
import { sendEmployeeNotification } from '@/lib/automation/employee-notifications/sendEmployeeNotification'

export const sendEmployeeNotificationTask = {
  slug: 'sendEmployeeNotification',
  label: 'Send employee notification',
  inputSchema: [
    {
      name: 'type',
      type: 'select',
      options: EMPLOYEE_NOTIFICATION_TYPES.map((value) => ({ label: value, value })),
      required: true,
    },
    {
      name: 'leadId',
      type: 'text',
    },
  ],
  handler: async ({ input, req }: { input?: unknown; req: PayloadRequest }) => {
    const parsed = (input ?? {}) as {
      leadId?: string
      type: (typeof EMPLOYEE_NOTIFICATION_TYPES)[number]
    }

    await sendEmployeeNotification(req.payload, {
      leadId: parsed.leadId || undefined,
      type: parsed.type,
    })

    return {
      output: {
        sent: true,
      },
    }
  },
  outputSchema: [
    {
      name: 'sent',
      type: 'checkbox',
      required: true,
    },
  ],
  retries: 2,
} as unknown as TaskConfig
