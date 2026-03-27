import type { TaskConfig } from 'payload'

import { CUSTOMER_NOTIFICATION_TYPES } from '@/lib/automation/notifications/constants'
import { sendCustomerNotification } from '@/lib/automation/notifications/sendCustomerNotification'

export const sendCustomerNotificationTask: TaskConfig = {
  slug: 'sendCustomerNotification',
  label: 'Send customer notification',
  inputSchema: [
    {
      name: 'type',
      type: 'select',
      options: CUSTOMER_NOTIFICATION_TYPES.map((value) => ({ label: value, value })),
      required: true,
    },
    {
      name: 'leadId',
      type: 'text',
    },
    {
      name: 'quoteId',
      type: 'text',
    },
    {
      name: 'invoiceId',
      type: 'text',
    },
    {
      name: 'appointmentId',
      type: 'text',
    },
  ],
  handler: async ({ input, req }) => {
    const parsed = (input ?? {}) as {
      appointmentId?: string
      invoiceId?: string
      leadId?: string
      quoteId?: string
      type: (typeof CUSTOMER_NOTIFICATION_TYPES)[number]
    }

    await sendCustomerNotification(req.payload, {
      appointmentId: parsed.appointmentId || undefined,
      invoiceId: parsed.invoiceId || undefined,
      leadId: parsed.leadId || undefined,
      quoteId: parsed.quoteId || undefined,
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
}
