import type { Payload } from 'payload'

import type {
  Account,
  Contact,
  CrmActivity,
  CrmSequence,
  CrmTask,
  Lead,
  Opportunity,
  User,
} from '@/payload-types'
import { buildCrmTaskData } from '@/lib/crm/tasks/data'
import { buildLeadWorkspaceFollowUpPolicy } from '@/lib/crm/tasks/policy'

import { opportunityStageLabel, taskStatusLabel } from './format'

type OwnerAssignableKind =
  | 'account'
  | 'contact'
  | 'lead'
  | 'opportunity'
  | 'sequence-definition'
  | 'task'

type OwnerAssignableDocument = Account | Contact | CrmSequence | CrmTask | Lead | Opportunity

type ActivitySeed = {
  account?: number | undefined
  contact?: number | undefined
  lead?: number | undefined
  opportunity?: number | undefined
  quote?: number | undefined
  relatedTask?: number | undefined
}

function relationId(value: null | number | string | { id: number | string } | undefined): number | undefined {
  if (!value) return undefined
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isInteger(parsed) ? parsed : undefined
  }
  if (typeof value.id === 'number') return value.id
  const parsed = Number(value.id)
  return Number.isInteger(parsed) ? parsed : undefined
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function ownerAssignableCollection(kind: OwnerAssignableKind) {
  switch (kind) {
    case 'account':
      return 'accounts'
    case 'contact':
      return 'contacts'
    case 'lead':
      return 'leads'
    case 'opportunity':
      return 'opportunities'
    case 'sequence-definition':
      return 'crm-sequences'
    case 'task':
      return 'crm-tasks'
    default:
      return 'accounts'
  }
}

function ownerActivityContext(
  kind: OwnerAssignableKind,
  doc: OwnerAssignableDocument,
): ActivitySeed {
  switch (kind) {
    case 'account': {
      const account = doc as Account
      return {
        account: account.id,
      }
    }
    case 'contact': {
      const contact = doc as Contact
      return {
        account: relationId(contact.account),
        contact: contact.id,
      }
    }
    case 'lead': {
      const lead = doc as Lead
      return {
        account: relationId(lead.account),
        contact: relationId(lead.contact),
        lead: lead.id,
      }
    }
    case 'opportunity': {
      const opportunity = doc as Opportunity
      return {
        account: relationId(opportunity.account),
        contact: relationId(opportunity.contact),
        lead: relationId(opportunity.lead),
        opportunity: opportunity.id,
        quote: relationId(opportunity.quote),
      }
    }
    case 'task': {
      const task = doc as CrmTask
      return {
        account: relationId(task.account),
        contact: relationId(task.contact),
        lead: relationId(task.lead),
        opportunity: relationId(task.opportunity),
        quote: relationId(task.quote),
        relatedTask: task.id,
      }
    }
    case 'sequence-definition':
      return {}
    default:
      return {}
  }
}

async function createSystemActivity(args: {
  body: string
  payload: Payload
  related: ActivitySeed
  title: string
  user: User
}) {
  return (await args.payload.create({
    collection: 'crm-activities',
    data: {
      ...args.related,
      activityType: 'system',
      body: args.body,
      direction: 'internal',
      occurredAt: new Date().toISOString(),
      owner: args.user.id,
      title: args.title,
    },
    overrideAccess: false,
    user: args.user,
  })) as CrmActivity
}

function ownerName(value: null | number | string | User | undefined): string {
  if (!value) return 'Unassigned'
  if (typeof value === 'number' || typeof value === 'string') return `User #${value}`
  return value.name?.trim() || value.email || `User #${value.id}`
}

function ownerRecordTitle(kind: OwnerAssignableKind, doc: OwnerAssignableDocument): string {
  switch (kind) {
    case 'account':
      return (doc as Account).name
    case 'contact':
      return (doc as Contact).fullName
    case 'lead':
    case 'opportunity':
    case 'task':
      return (doc as CrmTask | Lead | Opportunity).title
    case 'sequence-definition':
      return (doc as CrmSequence).name
    default:
      return 'CRM record'
  }
}

async function fetchOwner(payload: Payload, ownerId: null | number, user: User): Promise<null | User> {
  if (!ownerId) return null

  return (await payload.findByID({
    collection: 'users',
    id: ownerId,
    overrideAccess: false,
    user,
  })) as User
}

export async function updateCrmTaskStatus({
  id,
  payload,
  status,
  user,
}: {
  id: number
  payload: Payload
  status: 'completed' | 'in_progress'
  user: User
}) {
  const existing = (await payload.findByID({
    collection: 'crm-tasks',
    depth: 1,
    id,
    overrideAccess: false,
    user,
  })) as CrmTask

  const completedAt = status === 'completed' ? new Date().toISOString() : null

  const task = (await payload.update({
    collection: 'crm-tasks',
    id,
    data: {
      completedAt,
      status,
    },
    overrideAccess: false,
    user,
  })) as CrmTask

  await createSystemActivity({
    body: `Task status changed from ${taskStatusLabel(existing.status)} to ${taskStatusLabel(status)} in the CRM workspace.`,
    payload,
    related: ownerActivityContext('task', task),
    title: `Task updated: ${task.title}`,
    user,
  })

  return task
}

export async function advanceOpportunityStage({
  id,
  nextStage,
  payload,
  user,
}: {
  id: number
  nextStage: Opportunity['stage']
  payload: Payload
  user: User
}) {
  const existing = (await payload.findByID({
    collection: 'opportunities',
    depth: 1,
    id,
    overrideAccess: false,
    user,
  })) as Opportunity

  const nextStatus: Opportunity['status'] =
    nextStage === 'won' ? 'won' : nextStage === 'lost' ? 'lost' : 'open'

  const opportunity = (await payload.update({
    collection: 'opportunities',
    id,
    data: {
      expectedCloseDate: nextStatus === 'open' ? existing.expectedCloseDate : new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      stage: nextStage,
      status: nextStatus,
    },
    overrideAccess: false,
    user,
  })) as Opportunity

  await createSystemActivity({
    body: `Opportunity moved from ${opportunityStageLabel(existing.stage)} to ${opportunityStageLabel(nextStage)} in the CRM workspace.`,
    payload,
    related: ownerActivityContext('opportunity', opportunity),
    title: `Opportunity stage updated: ${opportunity.title}`,
    user,
  })

  return opportunity
}

export async function updateLeadStatus({
  id,
  payload,
  status,
  user,
}: {
  id: number
  payload: Payload
  status: 'disqualified' | 'qualified'
  user: User
}) {
  const existing = (await payload.findByID({
    collection: 'leads',
    depth: 1,
    id,
    overrideAccess: false,
    user,
  })) as Lead

  const lead = (await payload.update({
    collection: 'leads',
    id,
    data: {
      nextActionAt: status === 'qualified' ? existing.nextActionAt ?? daysFromNow(1) : null,
      staleAt: status === 'qualified' ? existing.staleAt ?? daysFromNow(2) : null,
      status,
    },
    overrideAccess: false,
    user,
  })) as Lead

  let createdOpportunity: null | Opportunity = null
  let createdTask: null | CrmTask = null

  if (status === 'qualified') {
    const existingOpportunities = await payload.find({
      collection: 'opportunities',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      user,
      where: {
        and: [{ lead: { equals: id } }, { status: { equals: 'open' } }],
      },
    })

    if (existingOpportunities.docs.length === 0) {
      createdOpportunity = (await payload.create({
        collection: 'opportunities',
        data: {
          account: relationId(lead.account),
          contact: relationId(lead.contact),
          lead: lead.id,
          nextAction: 'Prepare quote or schedule site walk',
          nextActionAt: daysFromNow(1),
          owner: relationId(lead.owner),
          priority: lead.priority,
          stage: 'qualified',
          status: 'open',
          title: lead.title,
        },
        overrideAccess: false,
        user,
      })) as Opportunity
    }

    const existingTasks = await payload.find({
      collection: 'crm-tasks',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      user,
      where: {
        and: [
          { lead: { equals: id } },
          { status: { in: ['open', 'in_progress', 'waiting'] } },
          { taskType: { equals: 'quote_follow_up' } },
        ],
      },
    })

    if (existingTasks.docs.length === 0) {
      const taskPolicy = buildLeadWorkspaceFollowUpPolicy({
        lead,
      })

      createdTask = (await payload.create({
        collection: 'crm-tasks',
        data: buildCrmTaskData({
          account: relationId(lead.account),
          contact: relationId(lead.contact),
          lead: lead.id,
          notes: 'Qualified from the CRM workspace. Prepare the quote or confirm the walkthrough.',
          opportunity: createdOpportunity?.id,
          owner: relationId(lead.owner),
          policy: taskPolicy,
          taskType: 'quote_follow_up',
          title: `Prepare quote for ${lead.customerName}`,
        }) as never,
        overrideAccess: false,
        user,
      })) as CrmTask
    }
  }

  await createSystemActivity({
    body:
      status === 'qualified'
        ? `Lead qualified in the CRM workspace.${createdOpportunity ? ` Opportunity ${createdOpportunity.id} was created.` : ''}${createdTask ? ` Follow-up task ${createdTask.id} was created.` : ''}`
        : 'Lead disqualified in the CRM workspace.',
    payload,
    related: ownerActivityContext('lead', lead),
    title: `Lead ${status === 'qualified' ? 'qualified' : 'disqualified'}: ${lead.title}`,
    user,
  })

  return lead
}

export async function assignCrmRecordOwner(args: {
  id: number
  kind: OwnerAssignableKind
  ownerId: null | number
  payload: Payload
  user: User
}) {
  const { id, kind, ownerId, payload, user } = args
  const collection = ownerAssignableCollection(kind)
  const existing = (await payload.findByID({
    collection,
    depth: 1,
    id,
    overrideAccess: false,
    user,
  })) as OwnerAssignableDocument
  const nextOwner = await fetchOwner(payload, ownerId, user)

  const updated = (await payload.update({
    collection,
    id,
    data: {
      owner: ownerId,
    },
    overrideAccess: false,
    user,
  })) as OwnerAssignableDocument

  await createSystemActivity({
    body: `Owner changed from ${ownerName((existing as { owner?: null | number | string | User }).owner)} to ${ownerName(nextOwner)} in the CRM workspace.`,
    payload,
    related: ownerActivityContext(kind, updated),
    title: `Owner updated: ${ownerRecordTitle(kind, updated)}`,
    user,
  })

  return updated
}

export function isOwnerAssignableKind(kind: string): kind is OwnerAssignableKind {
  return (
    kind === 'account'
    || kind === 'contact'
    || kind === 'lead'
    || kind === 'opportunity'
    || kind === 'sequence-definition'
    || kind === 'task'
  )
}
