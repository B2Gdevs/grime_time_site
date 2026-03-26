import type { Payload } from 'payload'

import type {
  Account,
  Contact,
  CrmActivity,
  CrmTask,
  Lead,
  Opportunity,
  Quote,
  SequenceEnrollment,
  User,
} from '@/payload-types'

import type { CrmRecordKind } from './types'

function relationId(
  value:
    | Account
    | Contact
    | CrmTask
    | Lead
    | Quote
    | Opportunity
    | SequenceEnrollment
    | number
    | string
    | null
    | undefined,
): null | number {
  if (!value) {
    return null
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (typeof value.id === 'number') {
    return value.id
  }

  const parsed = Number(value.id)
  return Number.isFinite(parsed) ? parsed : null
}

function relateFromOpportunity(opportunity: Opportunity) {
  return {
    account: relationId(opportunity.account),
    contact: relationId(opportunity.contact),
    lead: relationId(opportunity.lead),
    opportunity: opportunity.id,
    quote: relationId(opportunity.quote),
    relatedTask: null,
  }
}

function relateFromTask(task: CrmTask) {
  return {
    account: relationId(task.account),
    contact: relationId(task.contact),
    lead: relationId(task.lead),
    opportunity: relationId(task.opportunity),
    quote: null,
    relatedTask: task.id,
  }
}

async function loadRecordRelationships({
  id,
  payload,
  recordKind,
  user,
}: {
  id: number
  payload: Payload
  recordKind: CrmRecordKind
  user: User
}) {
  switch (recordKind) {
    case 'lead': {
      const lead = (await payload.findByID({
        collection: 'leads',
        depth: 1,
        id,
        overrideAccess: false,
        user,
      })) as Lead

      return {
        account: relationId(lead.account),
        contact: relationId(lead.contact),
        lead: lead.id,
        opportunity: null,
        quote: relationId(lead.relatedQuote),
        relatedTask: null,
      }
    }
    case 'contact': {
      const contact = (await payload.findByID({
        collection: 'contacts',
        depth: 1,
        id,
        overrideAccess: false,
        user,
      })) as Contact

      return {
        account: relationId(contact.account),
        contact: contact.id,
        lead: null,
        opportunity: null,
        quote: null,
        relatedTask: null,
      }
    }
    case 'account':
      return {
        account: id,
        contact: null,
        lead: null,
        opportunity: null,
        quote: null,
        relatedTask: null,
      }
    case 'opportunity': {
      const opportunity = (await payload.findByID({
        collection: 'opportunities',
        depth: 1,
        id,
        overrideAccess: false,
        user,
      })) as Opportunity

      return relateFromOpportunity(opportunity)
    }
    case 'task': {
      const task = (await payload.findByID({
        collection: 'crm-tasks',
        depth: 1,
        id,
        overrideAccess: false,
        user,
      })) as CrmTask

      return relateFromTask(task)
    }
    case 'sequence-enrollment': {
      const enrollment = (await payload.findByID({
        collection: 'sequence-enrollments',
        depth: 1,
        id,
        overrideAccess: false,
        user,
      })) as SequenceEnrollment

      return {
        account: relationId(enrollment.account),
        contact: relationId(enrollment.contact),
        lead: relationId(enrollment.lead),
        opportunity: relationId(enrollment.opportunity),
        quote: null,
        relatedTask: null,
      }
    }
    case 'sequence-definition':
      throw new Error('Sequence definitions do not support activity notes from the workspace yet.')
    default:
      throw new Error(`Unsupported CRM record kind: ${String(recordKind)}`)
  }
}

async function refreshLifecycleDates({
  occurredAt,
  payload,
  relationships,
  user,
}: {
  occurredAt: string
  payload: Payload
  relationships: Awaited<ReturnType<typeof loadRecordRelationships>>
  user: User
}) {
  if (relationships.contact) {
    await payload.update({
      collection: 'contacts',
      data: {
        lastContactAt: occurredAt,
      },
      id: relationships.contact,
      overrideAccess: false,
      user,
    })
  }

  if (relationships.opportunity) {
    await payload.update({
      collection: 'opportunities',
      data: {
        lastActivityAt: occurredAt,
      },
      id: relationships.opportunity,
      overrideAccess: false,
      user,
    })
  }
}

export async function createCrmActivityNote({
  body,
  payload,
  recordId,
  recordKind,
  title,
  user,
}: {
  body: string
  payload: Payload
  recordId: number
  recordKind: CrmRecordKind
  title: string
  user: User
}) {
  const occurredAt = new Date().toISOString()
  const relationships = await loadRecordRelationships({
    id: recordId,
    payload,
    recordKind,
    user,
  })

  const activity = (await payload.create({
    collection: 'crm-activities',
    data: {
      ...relationships,
      activityType: 'note',
      body,
      direction: 'internal',
      occurredAt,
      owner: user.id,
      title,
    },
    overrideAccess: false,
    user,
  })) as CrmActivity

  await refreshLifecycleDates({
    occurredAt,
    payload,
    relationships,
    user,
  })

  return activity
}
