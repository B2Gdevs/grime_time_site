import type { CollectionAfterChangeHook } from 'payload'

import { enrollSequenceTrigger } from '@/lib/automation/sequences/enroll'
import { relationId } from '@/lib/crm/internal/relationship'

function shouldNotify(status: null | string | undefined) {
  return status === 'confirmed' || status === 'reschedule_requested' || status === 'completed'
}

export const afterServiceAppointmentAutomation: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const previousStatus = operation === 'update' ? previousDoc?.status : null
  const nextStatus = doc.status

  if (shouldNotify(nextStatus) && nextStatus !== previousStatus) {
    await req.payload.jobs.queue({
      input: {
        appointmentId: String(doc.id),
        type: 'appointment_update',
      },
      overrideAccess: true,
      queue: 'customer-notifications',
      req,
      task: 'sendCustomerNotification',
    })
  }

  if (nextStatus === 'confirmed' && previousStatus !== 'confirmed') {
    await enrollSequenceTrigger({
      accountId: relationId(doc.account),
      contactId: null,
      ownerId: null,
      payload: req.payload,
      req,
      serviceAppointmentId: doc.id,
      servicePlanId: relationId(doc.servicePlan),
      title: doc.title,
      trigger: 'appointment_booked',
    })
  }

  if (nextStatus === 'completed' && previousStatus !== 'completed') {
    await enrollSequenceTrigger({
      accountId: relationId(doc.account),
      contactId: null,
      ownerId: null,
      payload: req.payload,
      req,
      serviceAppointmentId: doc.id,
      servicePlanId: relationId(doc.servicePlan),
      title: doc.title,
      trigger: 'job_completed',
    })
  }

  return doc
}
