import type { Payload } from 'payload'

import { enrollSequenceTrigger } from '@/lib/automation/sequences/enroll'
import { createBillingEvent } from '@/lib/billing/events'
import type { Invoice } from '@/payload-types'

export async function scanOverdueInvoices(args: { payload: Payload }) {
  const now = new Date().toISOString()
  const result = await args.payload.find({
    collection: 'invoices',
    depth: 1,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          dueDate: {
            less_than: now,
          },
        },
        {
          status: {
            in: ['open', 'partially_paid'],
          },
        },
      ],
    },
  })

  for (const invoice of result.docs as Invoice[]) {
    const updated = (await args.payload.update({
      collection: 'invoices',
      id: invoice.id,
      data: {
        status: 'overdue',
      },
      overrideAccess: true,
    })) as Invoice

    await createBillingEvent({
      accountId: typeof updated.account === 'object' ? updated.account?.id : null,
      customerUserId: typeof updated.customerUser === 'object' ? updated.customerUser?.id : null,
      eventLabel: `Invoice ${updated.invoiceNumber} marked overdue by automation`,
      eventType: 'invoice_overdue',
      invoiceId: updated.id,
      payload: args.payload,
      processedAt: new Date().toISOString(),
      sourceSystem: 'internal',
    })

    await args.payload.jobs.queue({
      input: {
        invoiceId: String(updated.id),
        type: 'invoice_overdue',
      },
      overrideAccess: true,
      queue: 'billing-automation',
      task: 'sendCustomerNotification',
    })

    await enrollSequenceTrigger({
      accountId: typeof updated.account === 'object' ? updated.account?.id : updated.account,
      contactId: null,
      invoiceId: updated.id,
      ownerId: null,
      payload: args.payload,
      title: updated.title,
      trigger: 'invoice_overdue',
    })
  }
}
