import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'
import {
  advanceOpportunityStage,
  createCrmActivityNote,
  loadCrmRecordDetail,
  loadCrmWorkspace,
  updateCrmTaskStatus,
} from '@/lib/crm/workspace'
import type { User } from '@/payload-types'

const testRunKey = `workspace-${Date.now()}`

let payload: Payload
let adminUser: User
let seededAccountId = 0
let seededOpportunityId = 0
let seededTaskId = 0
const created: Array<{ collection: string; id: number | string }> = []

async function createRecord<T>({
  collection,
  data,
}: {
  collection:
    | 'accounts'
    | 'contacts'
    | 'crm-activities'
    | 'crm-sequences'
    | 'crm-tasks'
    | 'leads'
    | 'opportunities'
    | 'sequence-enrollments'
    | 'users'
  data: Record<string, unknown>
}): Promise<T> {
  const doc = (await payload.create({
    collection,
    data,
    overrideAccess: true,
  } as never)) as unknown as T & { id: number | string }

  created.push({ collection, id: doc.id })

  return doc
}

describe('crm workspace', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    adminUser = (await createRecord<User>({
      collection: 'users',
      data: {
        email: `${testRunKey}@example.com`,
        password: 'test-password',
        roles: ['admin'],
      },
    })) as User

    const account = await createRecord<{ id: number }>({
      collection: 'accounts',
      data: {
        accountType: 'commercial',
        accountsPayablePhone: '555-0202',
        billingEmail: `${testRunKey}.billing@example.com`,
        locationCount: 3,
        name: `${testRunKey} account`,
        owner: adminUser.id,
        serviceLocationSummary: 'Three-site commercial account',
        status: 'prospect',
        taxExempt: true,
        taxExemptionReference: 'TX-EXEMPT-42',
      },
    })
    seededAccountId = account.id

    const contact = await createRecord<{ id: number }>({
      collection: 'contacts',
      data: {
        account: account.id,
        email: `${testRunKey}.contact@example.com`,
        fullName: `${testRunKey} contact`,
        nextActionAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        owner: adminUser.id,
        phone: '555-0101',
        status: 'active',
      },
    })

    const lead = await createRecord<{ id: number }>({
      collection: 'leads',
      data: {
        account: account.id,
        contact: contact.id,
        customerEmail: `${testRunKey}.lead@example.com`,
        customerName: `${testRunKey} lead`,
        nextActionAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        owner: adminUser.id,
        priority: 'high',
        serviceSummary: 'Commercial walkthrough requested',
        source: 'schedule_request',
        staleAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'working',
        title: `${testRunKey} lead`,
      },
    })

    const opportunity = await createRecord<{ id: number }>({
      collection: 'opportunities',
      data: {
        account: account.id,
        contact: contact.id,
        lead: lead.id,
        nextAction: 'Call back with walkthrough times',
        nextActionAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        owner: adminUser.id,
        priority: 'high',
        stage: 'follow_up',
        status: 'open',
        title: `${testRunKey} opportunity`,
        value: 2400,
      },
    })
    seededOpportunityId = opportunity.id

    const task = await createRecord<{ id: number }>({
      collection: 'crm-tasks',
      data: {
        account: account.id,
        contact: contact.id,
        dueAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        lead: lead.id,
        opportunity: opportunity.id,
        owner: adminUser.id,
        priority: 'high',
        status: 'open',
        taskType: 'quote_follow_up',
        title: `${testRunKey} task`,
      },
    })
    seededTaskId = task.id

    await createRecord({
      collection: 'crm-activities',
      data: {
        account: account.id,
        activityType: 'note',
        body: 'Initial walkthrough request received.',
        contact: contact.id,
        direction: 'internal',
        lead: lead.id,
        occurredAt: new Date().toISOString(),
        opportunity: opportunity.id,
        owner: adminUser.id,
        title: `${testRunKey} activity`,
      },
    })

    const sequence = await createRecord<{ id: number }>({
      collection: 'crm-sequences',
      data: {
        audience: 'lead',
        key: `${testRunKey}-sequence`,
        name: `${testRunKey} sequence`,
        owner: adminUser.id,
        status: 'draft',
        steps: [
          {
            delayAmount: 0,
            delayUnit: 'days',
            stepType: 'wait',
          },
        ],
        trigger: 'manual',
      },
    })

    await createRecord({
      collection: 'sequence-enrollments',
      data: {
        account: account.id,
        contact: contact.id,
        lead: lead.id,
        nextRunAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        opportunity: opportunity.id,
        owner: adminUser.id,
        sequenceDefinition: sequence.id,
        sequenceKey: `${testRunKey}-sequence`,
        status: 'queued',
        stepIndex: 0,
        title: `${testRunKey} enrollment`,
      },
    })
  }, 30000)

  afterAll(async () => {
    for (const entry of created.reverse()) {
      await payload.delete({
        collection: entry.collection as never,
        id: entry.id,
        overrideAccess: true,
      })
    }
  }, 30000)

  it('builds workspace queues from first-party CRM collections', async () => {
    const workspace = await loadCrmWorkspace({
      payload,
      user: adminUser,
    })

    const attentionItems = workspace.queues.find((queue) => queue.key === 'attention')?.items ?? []
    const pipelineItems = workspace.queues.find((queue) => queue.key === 'pipeline')?.items ?? []
    const taskItems = workspace.queues.find((queue) => queue.key === 'tasks')?.items ?? []
    const companyItems = workspace.queues.find((queue) => queue.key === 'accounts')?.items ?? []
    const automationItems = workspace.queues.find((queue) => queue.key === 'automation')?.items ?? []

    expect(workspace.metrics.find((metric) => metric.label === 'Open leads')?.value).not.toBe('0')
    expect(attentionItems.some((item) => item.title === `${testRunKey} lead`)).toBe(true)
    expect(pipelineItems.some((item) => item.title === `${testRunKey} opportunity`)).toBe(true)
    expect(taskItems.some((item) => item.title === `${testRunKey} task`)).toBe(true)
    expect(companyItems.some((item) => item.title === `${testRunKey} account`)).toBe(true)
    expect(automationItems.some((item) => item.title === `${testRunKey} sequence`)).toBe(true)
  })

  it('loads a lead detail view with related tasks and opportunities', async () => {
    const lead = await payload.find({
      collection: 'leads',
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        title: {
          equals: `${testRunKey} lead`,
        },
      },
    })

    const detail = await loadCrmRecordDetail({
      id: Number(lead.docs[0]?.id),
      payload,
      type: 'lead',
      user: adminUser,
    })

    expect(detail.title).toBe(`${testRunKey} lead`)
    expect(detail.relatedSections.some((section) => section.label === 'Open tasks' && section.items.length > 0)).toBe(
      true,
    )
    expect(detail.relatedSections.some((section) => section.label === 'Pipeline' && section.items.length > 0)).toBe(
      true,
    )
  })

  it('filters workspace results by search query', async () => {
    const workspace = await loadCrmWorkspace({
      payload,
      searchQuery: `${testRunKey}.billing@example.com`,
      user: adminUser,
    })

    const companyItems = workspace.queues.find((queue) => queue.key === 'accounts')?.items ?? []
    const taskItems = workspace.queues.find((queue) => queue.key === 'tasks')?.items ?? []

    expect(companyItems.some((item) => item.title === `${testRunKey} account`)).toBe(true)
    expect(taskItems).toHaveLength(0)
  })

  it('updates task status and opportunity stage through workspace actions', async () => {
    const task = await updateCrmTaskStatus({
      id: seededTaskId,
      payload,
      status: 'completed',
      user: adminUser,
    })

    const opportunity = await advanceOpportunityStage({
      id: seededOpportunityId,
      nextStage: 'scheduling',
      payload,
      user: adminUser,
    })

    expect(task.status).toBe('completed')
    expect(task.completedAt).toBeTruthy()
    expect(opportunity.stage).toBe('scheduling')
    expect(opportunity.status).toBe('open')
  }, 15000)

  it('creates CRM notes and exposes richer account detail data', async () => {
    const activity = await createCrmActivityNote({
      body: 'Commercial billing owner asked for monthly invoice batching.',
      payload,
      recordId: seededAccountId,
      recordKind: 'account',
      title: `${testRunKey} follow-up note`,
      user: adminUser,
    })

    const detail = await loadCrmRecordDetail({
      id: seededAccountId,
      payload,
      type: 'account',
      user: adminUser,
    })

    expect(activity.title).toBe(`${testRunKey} follow-up note`)
    expect(detail.fields.some((field) => field.label === 'AP phone' && field.value === '555-0202')).toBe(true)
    expect(detail.fields.some((field) => field.label === 'Locations' && field.value === '3')).toBe(true)
    expect(
      detail.relatedSections.some(
        (section) =>
          section.label === 'Recent activity'
          && section.items.some((item) => item.title === `${testRunKey} follow-up note`),
      ),
    ).toBe(true)
  })
})
