import type { CollectionAfterChangeHook } from 'payload'

import { enrollSequenceTrigger } from '@/lib/automation/sequences/enroll'
import { relationId } from '@/lib/crm/internal/relationship'

export const afterLeadAutomation: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') {
    return doc
  }

  await req.payload.jobs.queue({
    input: {
      leadId: String(doc.id),
      type: 'lead_acknowledgement',
    },
    overrideAccess: true,
    queue: 'customer-notifications',
    req,
    task: 'sendCustomerNotification',
  })

  await enrollSequenceTrigger({
    accountId: relationId(doc.account),
    contactId: relationId(doc.contact),
    leadId: doc.id,
    ownerId: relationId(doc.owner),
    payload: req.payload,
    req,
    title: doc.title,
    trigger: 'lead_created',
  })

  return doc
}
