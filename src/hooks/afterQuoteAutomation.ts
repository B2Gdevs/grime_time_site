import type { CollectionAfterChangeHook } from 'payload'

import { enrollSequenceTrigger } from '@/lib/automation/sequences/enroll'
import { relationId } from '@/lib/crm/internal/relationship'

export const afterQuoteAutomation: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const previousStatus = operation === 'update' ? previousDoc?.status : null
  const nextStatus = doc.status

  if (nextStatus === 'sent' && previousStatus !== 'sent') {
    await req.payload.jobs.queue({
      input: {
        quoteId: String(doc.id),
        type: 'quote_sent',
      },
      overrideAccess: true,
      queue: 'customer-notifications',
      req,
      task: 'sendCustomerNotification',
    })

    await enrollSequenceTrigger({
      accountId: relationId(doc.account),
      contactId: null,
      ownerId: null,
      payload: req.payload,
      quoteId: doc.id,
      req,
      title: doc.title,
      trigger: 'quote_sent',
    })
  }

  if (nextStatus === 'accepted' && previousStatus !== 'accepted') {
    await enrollSequenceTrigger({
      accountId: relationId(doc.account),
      contactId: null,
      ownerId: null,
      payload: req.payload,
      quoteId: doc.id,
      req,
      title: doc.title,
      trigger: 'quote_accepted',
    })
  }

  return doc
}
