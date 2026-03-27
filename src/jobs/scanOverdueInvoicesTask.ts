import type { TaskConfig } from 'payload'

import { scanOverdueInvoices } from '@/lib/automation/sequences/scanOverdueInvoices'

export const scanOverdueInvoicesTask: TaskConfig = {
  slug: 'scanOverdueInvoices',
  label: 'Scan overdue invoices',
  handler: async ({ req }) => {
    await scanOverdueInvoices({
      payload: req.payload,
    })

    return {
      output: {
        scanned: true,
      },
    }
  },
  outputSchema: [
    {
      name: 'scanned',
      type: 'checkbox',
      required: true,
    },
  ],
  retries: 0,
  schedule: [
    {
      cron: '0 0 8 * * *',
      queue: 'billing-automation',
    },
  ],
}
