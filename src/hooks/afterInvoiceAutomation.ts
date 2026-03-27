import type { CollectionAfterChangeHook } from 'payload'

import { enrollSequenceTrigger } from '@/lib/automation/sequences/enroll'
import { relationId } from '@/lib/crm/internal/relationship'

function isIssuedStatus(status: null | string | undefined) {
  return status === 'open' || status === 'partially_paid' || status === 'overdue'
}

export const afterInvoiceAutomation: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const previousStatus = operation === 'update' ? previousDoc?.status : null
  const nextStatus = doc.status

  if (isIssuedStatus(nextStatus) && !isIssuedStatus(previousStatus)) {
    await req.payload.jobs.queue({
      input: {
        invoiceId: String(doc.id),
        type: 'invoice_issued',
      },
      overrideAccess: true,
      queue: 'billing-automation',
      req,
      task: 'sendCustomerNotification',
    })

    await enrollSequenceTrigger({
      accountId: relationId(doc.account),
      contactId: null,
      invoiceId: doc.id,
      ownerId: null,
      payload: req.payload,
      req,
      title: doc.title,
      trigger: 'invoice_issued',
    })
  }

  return doc
}
