import type { Payload, Where } from 'payload'

import type {
  Account,
  Contact,
  CrmSequence,
  CrmTask,
  Lead,
  Opportunity,
  SequenceEnrollment,
  User,
} from '@/payload-types'

import {
  accountStatusLabel,
  accountTypeLabel,
  contactStatusLabel,
  formatCurrencyUsd,
  formatDateOnly,
  isOlderThanDays,
  isPastDue,
  leadSourceLabel,
  leadStatusLabel,
  nonEmptyParts,
  opportunityStageLabel,
  opportunityStatusLabel,
  ownerLabel,
  priorityLabel,
  priorityRank,
  sequenceAudienceLabel,
  sequenceDefinitionStatusLabel,
  sequenceEnrollmentStatusLabel,
  taskStatusLabel,
  taskTypeLabel,
} from './format'
import type {
  CrmWorkspaceData,
  CrmWorkspaceMetric,
  CrmWorkspaceQueue,
  CrmWorkspaceQueueItem,
  CrmWorkspaceQuickAction,
} from './types'

type WorkspaceContext = {
  now: Date
  payload: Payload
  user: User
}

function docTimestamp(value: null | string | undefined): number {
  if (!value) return 0
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

function compareByPriorityAndDate<T extends { priority?: null | string; sortDate?: null | string }>(a: T, b: T) {
  const priorityDiff = priorityRank(b.priority) - priorityRank(a.priority)
  if (priorityDiff !== 0) return priorityDiff

  return docTimestamp(a.sortDate) - docTimestamp(b.sortDate)
}

function compareByUpdated<T extends { updatedAt?: null | string }>(a: T, b: T) {
  return docTimestamp(b.updatedAt) - docTimestamp(a.updatedAt)
}

function queueItem(input: CrmWorkspaceQueueItem): CrmWorkspaceQueueItem {
  return input
}

function matchText(parts: Array<null | string | undefined>, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true

  return parts.some((part) => part?.toLowerCase().includes(needle))
}

function nextOpportunityAction(stage: Opportunity['stage']): CrmWorkspaceQuickAction | null {
  switch (stage) {
    case 'new_lead':
      return { kind: 'advance-opportunity', label: 'Qualify', nextStage: 'qualified' }
    case 'qualified':
      return { kind: 'advance-opportunity', label: 'Mark quoted', nextStage: 'quoted' }
    case 'quoted':
      return { kind: 'advance-opportunity', label: 'Start follow-up', nextStage: 'follow_up' }
    case 'follow_up':
      return { kind: 'advance-opportunity', label: 'Move to scheduling', nextStage: 'scheduling' }
    case 'scheduling':
      return { kind: 'advance-opportunity', label: 'Mark won', nextStage: 'won' }
    default:
      return null
  }
}

function taskActions(status: CrmTask['status']): CrmWorkspaceQuickAction[] {
  const actions: CrmWorkspaceQuickAction[] = []

  if (status !== 'in_progress' && status !== 'completed') {
    actions.push({ kind: 'set-task-in-progress', label: 'Start' })
  }

  if (status !== 'completed') {
    actions.push({ kind: 'complete-task', label: 'Complete' })
  }

  return actions
}

async function findDocs<T>({
  collection,
  limit = 12,
  payload,
  sort,
  user,
  where,
}: {
  collection:
    | 'accounts'
    | 'contacts'
    | 'crm-sequences'
    | 'crm-tasks'
    | 'leads'
    | 'opportunities'
    | 'sequence-enrollments'
  limit?: number
  payload: Payload
  sort?: string
  user: User
  where?: Where
}): Promise<T[]> {
  const result = await payload.find({
    collection,
    depth: 1,
    limit,
    overrideAccess: false,
    pagination: false,
    sort,
    user,
    where,
  })

  return result.docs as T[]
}

async function countDocs({
  collection,
  payload,
  user,
  where,
}: {
  collection:
    | 'accounts'
    | 'contacts'
    | 'crm-tasks'
    | 'leads'
    | 'opportunities'
    | 'sequence-enrollments'
  payload: Payload
  user: User
  where?: Where
}) {
  const result = await payload.count({
    collection,
    overrideAccess: false,
    user,
    where,
  })

  return result.totalDocs
}

function mapLeadItem(lead: Lead, now: Date): CrmWorkspaceQueueItem {
  const stale = isPastDue(lead.staleAt, now) || isPastDue(lead.nextActionAt, now)

  return queueItem({
    actions: [],
    badgeLabel: lead.source ? leadSourceLabel(lead.source) : null,
    href: `/admin/collections/leads/${lead.id}`,
    id: String(lead.id),
    kind: 'lead',
    meta: nonEmptyParts([
      lead.customerEmail,
      lead.customerPhone,
      formatDateOnly(lead.nextActionAt) ? `Next ${formatDateOnly(lead.nextActionAt)}` : null,
    ]),
    priorityLabel: priorityLabel(lead.priority),
    priorityValue: lead.priority,
    stale,
    statusLabel: leadStatusLabel(lead.status),
    statusValue: lead.status,
    subtitle: nonEmptyParts([lead.customerName, lead.serviceSummary]).join(' | ') || 'Inbound lead',
    title: lead.title,
  })
}

function mapContactItem(contact: Contact, now: Date): CrmWorkspaceQueueItem {
  const stale = isPastDue(contact.staleAt, now) || isPastDue(contact.nextActionAt, now)
  const accountName = typeof contact.account === 'object' ? contact.account?.name : null

  return queueItem({
    actions: [],
    badgeLabel: accountName,
    href: `/admin/collections/contacts/${contact.id}`,
    id: String(contact.id),
    kind: 'contact',
    meta: nonEmptyParts([
      contact.email,
      contact.phone,
      formatDateOnly(contact.nextActionAt) ? `Next ${formatDateOnly(contact.nextActionAt)}` : null,
    ]),
    priorityLabel: null,
    stale,
    statusLabel: contactStatusLabel(contact.status),
    statusValue: contact.status,
    subtitle: nonEmptyParts([accountName, ownerLabel(contact.owner as User | number | string | null)]).join(' | ')
      || 'CRM contact',
    title: contact.fullName,
  })
}

function mapOpportunityItem(opportunity: Opportunity, now: Date): CrmWorkspaceQueueItem {
  const stale =
    isPastDue(opportunity.nextActionAt, now) ||
    (!opportunity.nextActionAt && isOlderThanDays(opportunity.lastActivityAt, 3, now))

  const valueLabel =
    typeof opportunity.value === 'number' && Number.isFinite(opportunity.value)
      ? formatCurrencyUsd(opportunity.value)
      : null
  const accountName = typeof opportunity.account === 'object' ? opportunity.account?.name : null

  return queueItem({
    actions: nextOpportunityAction(opportunity.stage) ? [nextOpportunityAction(opportunity.stage) as CrmWorkspaceQuickAction] : [],
    badgeLabel: opportunity.stage ? opportunityStageLabel(opportunity.stage) : null,
    href: `/admin/collections/opportunities/${opportunity.id}`,
    id: String(opportunity.id),
    kind: 'opportunity',
    meta: nonEmptyParts([
      accountName,
      valueLabel,
      formatDateOnly(opportunity.nextActionAt)
        ? `Next ${formatDateOnly(opportunity.nextActionAt)}`
        : formatDateOnly(opportunity.expectedCloseDate)
          ? `Close ${formatDateOnly(opportunity.expectedCloseDate)}`
          : null,
    ]),
    priorityLabel: priorityLabel(opportunity.priority),
    priorityValue: opportunity.priority,
    stale,
    statusLabel: opportunityStatusLabel(opportunity.status),
    statusValue: opportunity.status,
    subtitle: nonEmptyParts([
      typeof opportunity.contact === 'object' ? opportunity.contact?.fullName : null,
      opportunity.nextAction,
    ]).join(' | ') || 'Open opportunity',
    title: opportunity.title,
  })
}

function mapTaskItem(task: CrmTask, now: Date): CrmWorkspaceQueueItem {
  const stale = isPastDue(task.staleAt, now) || isPastDue(task.dueAt, now)

  return queueItem({
    actions: taskActions(task.status),
    badgeLabel: task.taskType ? taskTypeLabel(task.taskType) : null,
    href: `/admin/collections/crm-tasks/${task.id}`,
    id: String(task.id),
    kind: 'task',
    meta: nonEmptyParts([
      formatDateOnly(task.dueAt) ? `Due ${formatDateOnly(task.dueAt)}` : null,
      typeof task.contact === 'object' ? task.contact?.fullName : null,
      typeof task.account === 'object' ? task.account?.name : null,
    ]),
    priorityLabel: priorityLabel(task.priority),
    priorityValue: task.priority,
    stale,
    statusLabel: taskStatusLabel(task.status),
    statusValue: task.status,
    subtitle: task.notes?.trim() || 'Follow-up task',
    title: task.title,
  })
}

function mapAccountItem(account: Account): CrmWorkspaceQueueItem {
  const commercialMeta =
    account.accountType && account.accountType !== 'residential'
      ? `${accountTypeLabel(account.accountType)}${typeof account.locationCount === 'number' ? ` | ${account.locationCount} site${account.locationCount === 1 ? '' : 's'}` : ''}`
      : accountTypeLabel(account.accountType)

  return queueItem({
    actions: [],
    badgeLabel: typeof account.activeServicePlan === 'object' ? 'Plan active' : null,
    href: `/admin/collections/accounts/${account.id}`,
    id: String(account.id),
    kind: 'account',
    meta: nonEmptyParts([
      commercialMeta,
      account.billingEmail,
      ownerLabel(account.owner as User | number | string | null),
    ]),
    priorityLabel: null,
    stale: false,
    statusLabel: accountStatusLabel(account.status),
    statusValue: account.status,
    subtitle: nonEmptyParts([account.legalName, account.serviceLocationSummary]).join(' | ') || 'Customer account',
    title: account.name,
  })
}

function mapSequenceDefinitionItem(sequence: CrmSequence): CrmWorkspaceQueueItem {
  return queueItem({
    actions: [],
    badgeLabel: sequence.audience ? sequenceAudienceLabel(sequence.audience) : null,
    href: `/admin/collections/crm-sequences/${sequence.id}`,
    id: String(sequence.id),
    kind: 'sequence-definition',
    meta: nonEmptyParts([
      sequence.trigger?.replaceAll('_', ' '),
      `${sequence.steps?.length ?? 0} step${sequence.steps?.length === 1 ? '' : 's'}`,
      ownerLabel(sequence.owner as User | number | string | null),
    ]),
    priorityLabel: null,
    stale: false,
    statusLabel: sequenceDefinitionStatusLabel(sequence.status),
    statusValue: sequence.status,
    subtitle: sequence.notes?.trim() || 'Sequence builder definition',
    title: sequence.name,
  })
}

function mapSequenceEnrollmentItem(enrollment: SequenceEnrollment, now: Date): CrmWorkspaceQueueItem {
  const stale = isPastDue(enrollment.nextRunAt, now)
  const definitionName =
    typeof enrollment.sequenceDefinition === 'object' ? enrollment.sequenceDefinition?.name : enrollment.sequenceKey

  return queueItem({
    actions: [],
    badgeLabel: definitionName,
    href: `/admin/collections/sequence-enrollments/${enrollment.id}`,
    id: String(enrollment.id),
    kind: 'sequence-enrollment',
    meta: nonEmptyParts([
      formatDateOnly(enrollment.nextRunAt) ? `Next ${formatDateOnly(enrollment.nextRunAt)}` : null,
      typeof enrollment.contact === 'object' ? enrollment.contact?.fullName : null,
      typeof enrollment.account === 'object' ? enrollment.account?.name : null,
    ]),
    priorityLabel: null,
    stale,
    statusLabel: sequenceEnrollmentStatusLabel(enrollment.status),
    statusValue: enrollment.status,
    subtitle: `Step ${enrollment.stepIndex + 1}`,
    title: enrollment.title,
  })
}

function filterQueueItems(items: CrmWorkspaceQueueItem[], searchQuery: string | undefined): CrmWorkspaceQueueItem[] {
  if (!searchQuery?.trim()) {
    return items
  }

  return items.filter((item) =>
    matchText(
      [
        item.badgeLabel,
        ...item.meta,
        item.priorityLabel,
        item.statusLabel,
        item.subtitle,
        item.title,
      ],
      searchQuery,
    ),
  )
}

async function loadAttentionQueue(context: WorkspaceContext): Promise<CrmWorkspaceQueue> {
  const nowIso = context.now.toISOString()
  const [leads, contacts, opportunities] = await Promise.all([
    findDocs<Lead>({
      collection: 'leads',
      limit: 12,
      payload: context.payload,
      sort: 'nextActionAt',
      user: context.user,
      where: {
        or: [{ staleAt: { less_than_equal: nowIso } }, { nextActionAt: { less_than_equal: nowIso } }],
      },
    }),
    findDocs<Contact>({
      collection: 'contacts',
      limit: 12,
      payload: context.payload,
      sort: 'nextActionAt',
      user: context.user,
      where: {
        and: [
          { status: { equals: 'active' } },
          {
            or: [{ staleAt: { less_than_equal: nowIso } }, { nextActionAt: { less_than_equal: nowIso } }],
          },
        ],
      },
    }),
    findDocs<Opportunity>({
      collection: 'opportunities',
      limit: 12,
      payload: context.payload,
      sort: 'nextActionAt',
      user: context.user,
      where: {
        and: [
          { status: { equals: 'open' } },
          {
            or: [
              { nextActionAt: { less_than_equal: nowIso } },
              { stage: { in: ['new_lead', 'qualified', 'follow_up'] } },
            ],
          },
        ],
      },
    }),
  ])

  const items = [
    ...leads
      .sort((a, b) =>
        compareByPriorityAndDate(
          { priority: a.priority, sortDate: a.nextActionAt },
          { priority: b.priority, sortDate: b.nextActionAt },
        ),
      )
      .map((item) => mapLeadItem(item, context.now)),
    ...contacts
      .sort((a, b) => compareByPriorityAndDate({ sortDate: a.nextActionAt }, { sortDate: b.nextActionAt }))
      .map((item) => mapContactItem(item, context.now)),
    ...opportunities
      .sort((a, b) =>
        compareByPriorityAndDate(
          { priority: a.priority, sortDate: a.nextActionAt },
          { priority: b.priority, sortDate: b.nextActionAt },
        ),
      )
      .map((item) => mapOpportunityItem(item, context.now)),
  ]
    .sort((a, b) => Number(b.stale) - Number(a.stale))
    .slice(0, 12)

  return {
    description: 'Anything stale, overdue, or hot enough to need attention first.',
    emptyMessage: 'No stale contacts or overdue follow-up are waiting right now.',
    items,
    key: 'attention',
    label: 'Needs attention',
  }
}

async function loadPipelineQueue(context: WorkspaceContext): Promise<CrmWorkspaceQueue> {
  const opportunities = await findDocs<Opportunity>({
    collection: 'opportunities',
    limit: 12,
    payload: context.payload,
    sort: '-updatedAt',
    user: context.user,
    where: {
      status: {
        equals: 'open',
      },
    },
  })

  const items = opportunities
    .sort((a, b) =>
      compareByPriorityAndDate(
        { priority: a.priority, sortDate: a.nextActionAt },
        { priority: b.priority, sortDate: b.nextActionAt },
      ),
    )
    .map((item) => mapOpportunityItem(item, context.now))

  return {
    description: 'Open opportunities moving from lead qualification into quote, follow-up, and scheduling.',
    emptyMessage: 'No open opportunities yet. New quote work will show here.',
    items,
    key: 'pipeline',
    label: 'Pipeline',
  }
}

async function loadTasksQueue(context: WorkspaceContext): Promise<CrmWorkspaceQueue> {
  const tasks = await findDocs<CrmTask>({
    collection: 'crm-tasks',
    limit: 12,
    payload: context.payload,
    sort: 'dueAt',
    user: context.user,
    where: {
      status: {
        in: ['open', 'in_progress', 'waiting'],
      },
    },
  })

  const items = tasks
    .sort((a, b) =>
      compareByPriorityAndDate(
        { priority: a.priority, sortDate: a.dueAt },
        { priority: b.priority, sortDate: b.dueAt },
      ),
    )
    .map((item) => mapTaskItem(item, context.now))

  return {
    description: 'Live work list for quote follow-up, billing, and scheduling.',
    emptyMessage: 'No open CRM tasks are queued.',
    items,
    key: 'tasks',
    label: 'Tasks',
  }
}

async function loadAccountsQueue(context: WorkspaceContext): Promise<CrmWorkspaceQueue> {
  const accounts = await findDocs<Account>({
    collection: 'accounts',
    limit: 12,
    payload: context.payload,
    sort: '-updatedAt',
    user: context.user,
    where: {
      accountType: {
        in: ['commercial', 'hoa_multifamily', 'municipal'],
      },
    },
  })

  const items = accounts.sort(compareByUpdated).map(mapAccountItem)

  return {
    description: 'Commercial-style accounts, multi-site customers, and accounts with more billing complexity.',
    emptyMessage: 'No commercial or multi-location accounts are in the CRM yet.',
    items,
    key: 'accounts',
    label: 'Companies',
  }
}

async function loadAutomationQueue(context: WorkspaceContext): Promise<CrmWorkspaceQueue> {
  const [definitions, enrollments] = await Promise.all([
    findDocs<CrmSequence>({
      collection: 'crm-sequences',
      limit: 8,
      payload: context.payload,
      sort: '-updatedAt',
      user: context.user,
      where: {
        status: {
          in: ['active', 'draft'],
        },
      },
    }),
    findDocs<SequenceEnrollment>({
      collection: 'sequence-enrollments',
      limit: 8,
      payload: context.payload,
      sort: 'nextRunAt',
      user: context.user,
      where: {
        status: {
          in: ['queued', 'active', 'paused'],
        },
      },
    }),
  ])

  const items = [
    ...definitions.sort(compareByUpdated).map(mapSequenceDefinitionItem),
    ...enrollments
      .sort((a, b) => docTimestamp(a.nextRunAt) - docTimestamp(b.nextRunAt))
      .map((item) => mapSequenceEnrollmentItem(item, context.now)),
  ].slice(0, 12)

  return {
    description: 'Sequence definitions and live enrollments for Payload jobs and Resend follow-up.',
    emptyMessage: 'No sequence definitions or enrollments are active yet.',
    items,
    key: 'automation',
    label: 'Automation',
  }
}

async function loadMetrics(context: WorkspaceContext): Promise<CrmWorkspaceMetric[]> {
  const nowIso = context.now.toISOString()
  const [openLeads, openOpportunities, staleContacts, openTasks, activeEnrollments] = await Promise.all([
    countDocs({
      collection: 'leads',
      payload: context.payload,
      user: context.user,
      where: {
        status: {
          in: ['new', 'working', 'qualified'],
        },
      },
    }),
    countDocs({
      collection: 'opportunities',
      payload: context.payload,
      user: context.user,
      where: {
        status: {
          equals: 'open',
        },
      },
    }),
    countDocs({
      collection: 'contacts',
      payload: context.payload,
      user: context.user,
      where: {
        and: [
          { status: { equals: 'active' } },
          {
            or: [{ staleAt: { less_than_equal: nowIso } }, { nextActionAt: { less_than_equal: nowIso } }],
          },
        ],
      },
    }),
    countDocs({
      collection: 'crm-tasks',
      payload: context.payload,
      user: context.user,
      where: {
        status: {
          in: ['open', 'in_progress', 'waiting'],
        },
      },
    }),
    countDocs({
      collection: 'sequence-enrollments',
      payload: context.payload,
      user: context.user,
      where: {
        status: {
          in: ['queued', 'active'],
        },
      },
    }),
  ])

  return [
    {
      description: 'Leads still in intake or qualification.',
      label: 'Open leads',
      tone: openLeads > 0 ? 'default' : 'positive',
      value: String(openLeads),
    },
    {
      description: 'Open deal records tied to quote and scheduling flow.',
      label: 'Open opportunities',
      tone: openOpportunities > 0 ? 'default' : 'positive',
      value: String(openOpportunities),
    },
    {
      description: 'Contacts needing a reply or next action now.',
      label: 'Stale contacts',
      tone: staleContacts > 0 ? 'warning' : 'positive',
      value: String(staleContacts),
    },
    {
      description: 'Open CRM tasks for staff action.',
      label: 'Open tasks',
      tone: openTasks > 0 ? 'default' : 'positive',
      value: String(openTasks),
    },
    {
      description: 'Sequence enrollments queued or currently running.',
      label: 'Active sequences',
      tone: activeEnrollments > 0 ? 'default' : 'positive',
      value: String(activeEnrollments),
    },
  ]
}

export async function loadCrmWorkspace({
  payload,
  searchQuery,
  user,
}: {
  payload: Payload
  searchQuery?: string
  user: User
}): Promise<CrmWorkspaceData> {
  const context: WorkspaceContext = {
    now: new Date(),
    payload,
    user,
  }

  const [metrics, attention, pipeline, tasks, accounts, automation] = await Promise.all([
    loadMetrics(context),
    loadAttentionQueue(context),
    loadPipelineQueue(context),
    loadTasksQueue(context),
    loadAccountsQueue(context),
    loadAutomationQueue(context),
  ])

  return {
    generatedAt: context.now.toISOString(),
    metrics,
    queues: [attention, pipeline, tasks, accounts, automation].map((queue) => ({
      ...queue,
      items: filterQueueItems(queue.items, searchQuery),
    })),
    searchQuery,
  }
}
