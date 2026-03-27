import type { Payload, PayloadRequest, Where } from 'payload'

import { queueSequenceEnrollmentStep } from '@/lib/automation/sequences/queue'
import type { CrmSequence, SequenceEnrollment } from '@/payload-types'

function toNumberID(value: null | number | string | undefined): null | number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) ? null : parsed
  }

  return null
}

type SequenceTrigger =
  | 'appointment_booked'
  | 'invoice_issued'
  | 'invoice_overdue'
  | 'job_completed'
  | 'lead_created'
  | 'manual'
  | 'quote_accepted'
  | 'quote_sent'

type EnrollSequenceTriggerArgs = {
  accountId?: null | number | string
  contactId?: null | number | string
  invoiceId?: null | number | string
  leadId?: null | number | string
  opportunityId?: null | number | string
  ownerId?: null | number | string
  payload: Payload
  quoteId?: null | number | string
  req?: PayloadRequest
  serviceAppointmentId?: null | number | string
  servicePlanId?: null | number | string
  title: string
  trigger: SequenceTrigger
}

function activeTriggerWhere(trigger: SequenceTrigger): Where {
  return {
    and: [
      {
        status: {
          equals: 'active',
        },
      },
      {
        trigger: {
          equals: trigger,
        },
      },
    ],
  }
}

function enrollmentIdentityWhere(args: {
  invoiceId?: null | number | string
  leadId?: null | number | string
  opportunityId?: null | number | string
  quoteId?: null | number | string
  sequenceKey: string
  serviceAppointmentId?: null | number | string
  servicePlanId?: null | number | string
}): Where {
  const and: Where[] = [
    {
      sequenceKey: {
        equals: args.sequenceKey,
      },
    },
    {
      status: {
        in: ['queued', 'active', 'paused'],
      },
    },
  ]

  if (args.leadId) {
    and.push({
      lead: {
        equals: args.leadId,
      },
    })
  }

  if (args.quoteId) {
    and.push({
      quote: {
        equals: args.quoteId,
      },
    })
  }

  if (args.invoiceId) {
    and.push({
      invoice: {
        equals: args.invoiceId,
      },
    })
  }

  if (args.opportunityId) {
    and.push({
      opportunity: {
        equals: args.opportunityId,
      },
    })
  }

  if (args.serviceAppointmentId) {
    and.push({
      serviceAppointment: {
        equals: args.serviceAppointmentId,
      },
    })
  }

  if (args.servicePlanId) {
    and.push({
      servicePlan: {
        equals: args.servicePlanId,
      },
    })
  }

  return { and }
}

async function activeDefinitionsForTrigger(
  payload: Payload,
  trigger: SequenceTrigger,
  req?: PayloadRequest,
) {
  const result = await payload.find({
    collection: 'crm-sequences',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    pagination: false,
    req,
    where: activeTriggerWhere(trigger),
  })

  return result.docs as CrmSequence[]
}

async function existingEnrollment(args: EnrollSequenceTriggerArgs & { sequenceKey: string }) {
  const result = await args.payload.find({
    collection: 'sequence-enrollments',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req: args.req,
    where: enrollmentIdentityWhere(args),
  })

  return (result.docs[0] as SequenceEnrollment | undefined) ?? null
}

export async function enrollSequenceTrigger(args: EnrollSequenceTriggerArgs) {
  const definitions = await activeDefinitionsForTrigger(args.payload, args.trigger, args.req)

  for (const definition of definitions) {
    const duplicate = await existingEnrollment({
      ...args,
      sequenceKey: definition.key,
    })

    if (duplicate) {
      continue
    }

    const enrollment = await args.payload.create({
      collection: 'sequence-enrollments',
      data: {
        account: toNumberID(args.accountId) ?? undefined,
        contact: toNumberID(args.contactId) ?? undefined,
        invoice: toNumberID(args.invoiceId) ?? undefined,
        lead: toNumberID(args.leadId) ?? undefined,
        nextRunAt: new Date().toISOString(),
        opportunity: toNumberID(args.opportunityId) ?? undefined,
        owner: toNumberID(args.ownerId) ?? undefined,
        quote: toNumberID(args.quoteId) ?? undefined,
        sequenceDefinition: definition.id,
        sequenceKey: definition.key,
        serviceAppointment: toNumberID(args.serviceAppointmentId) ?? undefined,
        servicePlan: toNumberID(args.servicePlanId) ?? undefined,
        status: 'queued',
        stepIndex: 0,
        title: `${definition.name} - ${args.title}`,
      },
      overrideAccess: true,
      req: args.req,
    })

    await queueSequenceEnrollmentStep({
      enrollmentId: enrollment.id,
      payload: args.payload,
      req: args.req,
    })
  }
}
