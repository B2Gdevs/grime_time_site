import type { CollectionAfterChangeHook } from 'payload'

import { enrollSequenceTrigger } from '@/lib/automation/sequences/enroll'
import { relationId } from '@/lib/crm/internal/relationship'

export const afterLeadAutomation: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation === 'create') {
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

    await req.payload.jobs.queue({
      input: {
        leadId: String(doc.id),
        type: 'lead_created',
      },
      overrideAccess: true,
      queue: 'employee-notifications',
      req,
      task: 'sendEmployeeNotification' as never,
    } as never)

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

  const previousOwnerId = relationId(previousDoc?.owner)
  const nextOwnerId = relationId(doc.owner)
  const ownerChanged = previousOwnerId !== nextOwnerId

  if (ownerChanged && nextOwnerId) {
    await req.payload.jobs.queue({
      input: {
        leadId: String(doc.id),
        type: 'lead_owner_reassigned',
      },
      overrideAccess: true,
      queue: 'employee-notifications',
      req,
      task: 'sendEmployeeNotification' as never,
    } as never)
  }

  return doc
}
