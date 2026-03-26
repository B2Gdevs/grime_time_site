import type { Payload } from 'payload'

import type { CrmActivity, CrmTask, Opportunity, User } from '@/payload-types'

import { opportunityStageLabel, taskStatusLabel } from './format'

async function createSystemActivity({
  body,
  payload,
  relatedTask,
  title,
  user,
}: {
  body: string
  payload: Payload
  relatedTask?: CrmTask | null
  title: string
  user: User
}) {
  return (await payload.create({
    collection: 'crm-activities',
    data: {
      account: typeof relatedTask?.account === 'object' ? relatedTask.account?.id : relatedTask?.account,
      activityType: 'system',
      body,
      contact: typeof relatedTask?.contact === 'object' ? relatedTask.contact?.id : relatedTask?.contact,
      direction: 'internal',
      lead: typeof relatedTask?.lead === 'object' ? relatedTask.lead?.id : relatedTask?.lead,
      occurredAt: new Date().toISOString(),
      opportunity:
        typeof relatedTask?.opportunity === 'object' ? relatedTask.opportunity?.id : relatedTask?.opportunity,
      owner: user.id,
      relatedTask: relatedTask?.id,
      title,
    },
    overrideAccess: false,
    user,
  })) as CrmActivity
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
    relatedTask: task,
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

  await payload.create({
    collection: 'crm-activities',
    data: {
      account:
        typeof opportunity.account === 'object' ? opportunity.account?.id : opportunity.account,
      activityType: 'system',
      body: `Opportunity moved from ${opportunityStageLabel(existing.stage)} to ${opportunityStageLabel(nextStage)} in the CRM workspace.`,
      contact:
        typeof opportunity.contact === 'object' ? opportunity.contact?.id : opportunity.contact,
      direction: 'internal',
      lead: typeof opportunity.lead === 'object' ? opportunity.lead?.id : opportunity.lead,
      occurredAt: new Date().toISOString(),
      opportunity: opportunity.id,
      owner: user.id,
      quote: typeof opportunity.quote === 'object' ? opportunity.quote?.id : opportunity.quote,
      title: `Opportunity stage updated: ${opportunity.title}`,
    },
    overrideAccess: false,
    user,
  })

  return opportunity
}
