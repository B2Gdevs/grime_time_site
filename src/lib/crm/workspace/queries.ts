import type { Payload, Where } from 'payload'

import { isAdminUser } from '@/lib/auth/roles'
import { resolveDemoAccountIds } from '@/lib/demo/resolveDemoAccountIds'
import { scopeWhereForAccount, scopeWhereForAccountsCollection } from '@/lib/demo/scopeWhere'

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
  taskSlaLabel,
  taskSourceLabel,
  taskStatusLabel,
  taskTypeLabel,
  roleTagLabel,
} from './format'
import type {
  CrmWorkspaceData,
  CrmWorkspaceMetric,
  CrmWorkspaceOwnerScope,
  CrmWorkspaceQueue,
  CrmWorkspaceQueueItem,
  CrmWorkspaceQuickAction,
} from './types'

type WorkspaceContext = {
  commercialOnly: boolean
  demoAccountIds: number[] | null
  now: Date
  ownerScope: CrmWorkspaceOwnerScope
  payload: Payload
  user: User
}

const COMMERCIAL_ACCOUNT_TYPES = ['commercial', 'hoa_multifamily', 'municipal'] as const
const DEFAULT_QUEUE_LIMIT = 24

function mergeDemoWhere(
  collection:
    | 'accounts'
    | 'contacts'
    | 'crm-sequences'
    | 'crm-tasks'
    | 'leads'
    | 'opportunities'
    | 'sequence-enrollments',
  where: Where | undefined,
  demoAccountIds: number[] | null,
): Where | undefined {
  if (!demoAccountIds?.length) return where
  if (collection === 'crm-sequences') return where
  if (collection === 'accounts') return scopeWhereForAccountsCollection(where, demoAccountIds)
  return scopeWhereForAccount(where, demoAccountIds)
}

function docTimestamp(value: null | string | undefined): number {
  if (!value) return 0
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

function relationId(value: null | number | string | { id: number | string } | undefined): null | string {
  if (!value) return null
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  return value.id ? String(value.id) : null
}

function isCommercialAccountType(value: null | string | undefined): boolean {
  return COMMERCIAL_ACCOUNT_TYPES.includes(value as (typeof COMMERCIAL_ACCOUNT_TYPES)[number])
}

function matchesOwnerScope(item: CrmWorkspaceQueueItem, ownerScope: CrmWorkspaceOwnerScope, userId: string): boolean {
  if (ownerScope === 'all') return true
  if (ownerScope === 'mine') return item.ownerId === userId
  return !item.ownerId
}

function matchesCommercialScope(item: CrmWorkspaceQueueItem, commercialOnly: boolean): boolean {
  if (!commercialOnly) return true
  if (item.kind === 'sequence-definition') return true
  return Boolean(item.isCommercial)
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

function leadActions(status: Lead['status']): CrmWorkspaceQuickAction[] {
  const actions: CrmWorkspaceQuickAction[] = []

  if (status === 'new' || status === 'working') {
    actions.push({ kind: 'qualify-lead', label: 'Qualify' })
  }

  if (status !== 'disqualified' && status !== 'converted') {
    actions.push({ kind: 'disqualify-lead', label: 'Disqualify' })
  }

  return actions
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
  demoAccountIds,
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
  demoAccountIds: number[] | null
  limit?: number
  payload: Payload
  sort?: string
  user: User
  where?: Where
}): Promise<T[]> {
  const mergedWhere = mergeDemoWhere(collection, where, demoAccountIds)
  const result = await payload.find({
    collection,
    depth: 1,
    limit,
    overrideAccess: false,
    pagination: false,
    sort,
    user,
    where: mergedWhere,
  })

  return result.docs as T[]
}

function mergeWhereClauses(...clauses: Array<undefined | Where>): undefined | Where {
  const filtered = clauses.filter(Boolean) as Where[]

  if (filtered.length === 0) return undefined
  if (filtered.length === 1) return filtered[0]

  return {
    and: filtered,
  }
}

function ownerScopeWhere(ownerScope: CrmWorkspaceOwnerScope, userId: number | string): undefined | Where {
  if (ownerScope === 'all') return undefined
  if (ownerScope === 'mine') {
    return {
      owner: {
        equals: userId,
      },
    }
  }

  return {
    owner: {
      exists: false,
    },
  }
}

async function countDocs({
  collection,
  demoAccountIds,
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
  demoAccountIds: number[] | null
  payload: Payload
  user: User
  where?: Where
}) {
  const mergedWhere = mergeDemoWhere(collection, where, demoAccountIds)
  const result = await payload.count({
    collection,
    overrideAccess: false,
    user,
    where: mergedWhere,
  })

  return result.totalDocs
}

function mapLeadItem(lead: Lead, now: Date): CrmWorkspaceQueueItem {
  const stale = isPastDue(lead.staleAt, now) || isPastDue(lead.nextActionAt, now)
  const accountType =
    typeof lead.account === 'object' && lead.account ? lead.account.accountType : null

  return queueItem({
    actions: leadActions(lead.status),
    badgeLabel: lead.source ? leadSourceLabel(lead.source) : null,
    href: `/admin/collections/leads/${lead.id}`,
    id: String(lead.id),
    isCommercial: isCommercialAccountType(accountType),
    kind: 'lead',
    meta: nonEmptyParts([
      lead.customerEmail,
      lead.customerPhone,
      formatDateOnly(lead.nextActionAt) ? `Next ${formatDateOnly(lead.nextActionAt)}` : null,
    ]),
    ownerId: relationId(lead.owner),
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
  const accountType = typeof contact.account === 'object' ? contact.account?.accountType : null

  return queueItem({
    actions: [],
    badgeLabel: accountName,
    href: `/admin/collections/contacts/${contact.id}`,
    id: String(contact.id),
    isCommercial: isCommercialAccountType(accountType),
    kind: 'contact',
    meta: nonEmptyParts([
      contact.email,
      contact.phone,
      formatDateOnly(contact.nextActionAt) ? `Next ${formatDateOnly(contact.nextActionAt)}` : null,
    ]),
    ownerId: relationId(contact.owner),
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
  const accountType = typeof opportunity.account === 'object' ? opportunity.account?.accountType : null

  return queueItem({
    actions: nextOpportunityAction(opportunity.stage) ? [nextOpportunityAction(opportunity.stage) as CrmWorkspaceQuickAction] : [],
    badgeLabel: opportunity.stage ? opportunityStageLabel(opportunity.stage) : null,
    href: `/admin/collections/opportunities/${opportunity.id}`,
    id: String(opportunity.id),
    isCommercial: isCommercialAccountType(accountType),
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
    ownerId: relationId(opportunity.owner),
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
  const accountType = typeof task.account === 'object' ? task.account?.accountType : null
  const firstRoleTag =
    Array.isArray(task.roleTags) && task.roleTags.length > 0 ? roleTagLabel(task.roleTags[0]) : null

  return queueItem({
    actions: taskActions(task.status),
    badgeLabel: task.slaClass ? taskSlaLabel(task.slaClass) : task.taskType ? taskTypeLabel(task.taskType) : null,
    href: `/admin/collections/crm-tasks/${task.id}`,
    id: String(task.id),
    isCommercial: isCommercialAccountType(accountType),
    kind: 'task',
    meta: nonEmptyParts([
      formatDateOnly(task.dueAt) ? `Due ${formatDateOnly(task.dueAt)}` : null,
      firstRoleTag,
      task.sourceType ? taskSourceLabel(task.sourceType) : null,
      typeof task.contact === 'object' ? task.contact?.fullName : null,
      typeof task.account === 'object' ? task.account?.name : null,
    ]),
    ownerId: relationId(task.owner),
    priorityLabel: priorityLabel(task.priority),
    priorityValue: task.priority,
    stale,
    statusLabel: taskStatusLabel(task.status),
    statusValue: task.status,
    subtitle: task.nextAction?.trim() || task.notes?.trim() || 'Follow-up task',
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
    isCommercial: isCommercialAccountType(account.accountType),
    kind: 'account',
    meta: nonEmptyParts([
      commercialMeta,
      account.billingEmail,
      ownerLabel(account.owner as User | number | string | null),
    ]),
    ownerId: relationId(account.owner),
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
    isCommercial: false,
    kind: 'sequence-definition',
    meta: nonEmptyParts([
      sequence.trigger?.replaceAll('_', ' '),
      `${sequence.steps?.length ?? 0} step${sequence.steps?.length === 1 ? '' : 's'}`,
      ownerLabel(sequence.owner as User | number | string | null),
    ]),
    ownerId: relationId(sequence.owner),
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
  const accountType = typeof enrollment.account === 'object' ? enrollment.account?.accountType : null

  return queueItem({
    actions: [],
    badgeLabel: definitionName,
    href: `/admin/collections/sequence-enrollments/${enrollment.id}`,
    id: String(enrollment.id),
    isCommercial: isCommercialAccountType(accountType),
    kind: 'sequence-enrollment',
    meta: nonEmptyParts([
      formatDateOnly(enrollment.nextRunAt) ? `Next ${formatDateOnly(enrollment.nextRunAt)}` : null,
      typeof enrollment.contact === 'object' ? enrollment.contact?.fullName : null,
      typeof enrollment.account === 'object' ? enrollment.account?.name : null,
    ]),
    ownerId: relationId(enrollment.owner),
    priorityLabel: null,
    stale,
    statusLabel: sequenceEnrollmentStatusLabel(enrollment.status),
    statusValue: enrollment.status,
    subtitle: `Step ${enrollment.stepIndex + 1}`,
    title: enrollment.title,
  })
}

function filterQueueItems(args: {
  commercialOnly: boolean
  items: CrmWorkspaceQueueItem[]
  ownerScope: CrmWorkspaceOwnerScope
  searchQuery?: string
  userId: string
}): CrmWorkspaceQueueItem[] {
  const { commercialOnly, items, ownerScope, searchQuery, userId } = args

  return items.filter((item) => {
    if (!matchesOwnerScope(item, ownerScope, userId)) return false
    if (!matchesCommercialScope(item, commercialOnly)) return false

    return matchText(
      [
        item.badgeLabel,
        ...item.meta,
        item.priorityLabel,
        item.statusLabel,
        item.subtitle,
        item.title,
      ],
      searchQuery ?? '',
    )
  })
}

async function loadAttentionQueue(context: WorkspaceContext): Promise<CrmWorkspaceQueue> {
  const nowIso = context.now.toISOString()
  const ownerWhere = ownerScopeWhere(context.ownerScope, context.user.id)
  const [leads, contacts, opportunities] = await Promise.all([
    findDocs<Lead>({
      collection: 'leads',
      demoAccountIds: context.demoAccountIds,
      limit: DEFAULT_QUEUE_LIMIT,
      payload: context.payload,
      sort: 'nextActionAt',
      user: context.user,
      where: mergeWhereClauses(ownerWhere, {
        or: [{ staleAt: { less_than_equal: nowIso } }, { nextActionAt: { less_than_equal: nowIso } }],
      }),
    }),
    findDocs<Contact>({
      collection: 'contacts',
      demoAccountIds: context.demoAccountIds,
      limit: DEFAULT_QUEUE_LIMIT,
      payload: context.payload,
      sort: 'nextActionAt',
      user: context.user,
      where: mergeWhereClauses(ownerWhere, {
        and: [
          { status: { equals: 'active' } },
          {
            or: [{ staleAt: { less_than_equal: nowIso } }, { nextActionAt: { less_than_equal: nowIso } }],
          },
        ],
      }),
    }),
    findDocs<Opportunity>({
      collection: 'opportunities',
      demoAccountIds: context.demoAccountIds,
      limit: DEFAULT_QUEUE_LIMIT,
      payload: context.payload,
      sort: 'nextActionAt',
      user: context.user,
      where: mergeWhereClauses(ownerWhere, {
        and: [
          { status: { equals: 'open' } },
          {
            or: [
              { nextActionAt: { less_than_equal: nowIso } },
              { stage: { in: ['new_lead', 'qualified', 'follow_up'] } },
            ],
          },
        ],
      }),
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
  const ownerWhere = ownerScopeWhere(context.ownerScope, context.user.id)
  const opportunities = await findDocs<Opportunity>({
    collection: 'opportunities',
    demoAccountIds: context.demoAccountIds,
    limit: DEFAULT_QUEUE_LIMIT,
    payload: context.payload,
    sort: '-updatedAt',
    user: context.user,
    where: mergeWhereClauses(ownerWhere, {
      status: {
        equals: 'open',
      },
    }),
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
  const ownerWhere = ownerScopeWhere(context.ownerScope, context.user.id)
  const tasks = await findDocs<CrmTask>({
    collection: 'crm-tasks',
    demoAccountIds: context.demoAccountIds,
    limit: DEFAULT_QUEUE_LIMIT,
    payload: context.payload,
    sort: 'dueAt',
    user: context.user,
    where: mergeWhereClauses(ownerWhere, {
      status: {
        in: ['open', 'in_progress', 'waiting'],
      },
    }),
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
    demoAccountIds: context.demoAccountIds,
    limit: DEFAULT_QUEUE_LIMIT,
    payload: context.payload,
    sort: '-updatedAt',
    user: context.user,
    where: mergeWhereClauses(ownerScopeWhere(context.ownerScope, context.user.id), {
      accountType: {
        in: [...COMMERCIAL_ACCOUNT_TYPES],
      },
    }),
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
  const ownerWhere = ownerScopeWhere(context.ownerScope, context.user.id)
  const [definitions, enrollments] = await Promise.all([
    findDocs<CrmSequence>({
      collection: 'crm-sequences',
      demoAccountIds: context.demoAccountIds,
      limit: 12,
      payload: context.payload,
      sort: '-updatedAt',
      user: context.user,
      where: mergeWhereClauses(ownerWhere, {
        status: {
          in: ['active', 'draft'],
        },
      }),
    }),
    findDocs<SequenceEnrollment>({
      collection: 'sequence-enrollments',
      demoAccountIds: context.demoAccountIds,
      limit: 12,
      payload: context.payload,
      sort: 'nextRunAt',
      user: context.user,
      where: mergeWhereClauses(ownerWhere, {
        status: {
          in: ['queued', 'active', 'paused'],
        },
      }),
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
  const ownerWhere = ownerScopeWhere(context.ownerScope, context.user.id)
  const [openLeads, openOpportunities, staleContacts, openTasks, activeEnrollments] = await Promise.all([
    countDocs({
      collection: 'leads',
      demoAccountIds: context.demoAccountIds,
      payload: context.payload,
      user: context.user,
      where: mergeWhereClauses(ownerWhere, {
        status: {
          in: ['new', 'working', 'qualified'],
        },
      }),
    }),
    countDocs({
      collection: 'opportunities',
      demoAccountIds: context.demoAccountIds,
      payload: context.payload,
      user: context.user,
      where: mergeWhereClauses(ownerWhere, {
        status: {
          equals: 'open',
        },
      }),
    }),
    countDocs({
      collection: 'contacts',
      demoAccountIds: context.demoAccountIds,
      payload: context.payload,
      user: context.user,
      where: mergeWhereClauses(ownerWhere, {
        and: [
          { status: { equals: 'active' } },
          {
            or: [{ staleAt: { less_than_equal: nowIso } }, { nextActionAt: { less_than_equal: nowIso } }],
          },
        ],
      }),
    }),
    countDocs({
      collection: 'crm-tasks',
      demoAccountIds: context.demoAccountIds,
      payload: context.payload,
      user: context.user,
      where: mergeWhereClauses(ownerWhere, {
        status: {
          in: ['open', 'in_progress', 'waiting'],
        },
      }),
    }),
    countDocs({
      collection: 'sequence-enrollments',
      demoAccountIds: context.demoAccountIds,
      payload: context.payload,
      user: context.user,
      where: mergeWhereClauses(ownerWhere, {
        status: {
          in: ['queued', 'active'],
        },
      }),
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
  commercialOnly = false,
  demoMode,
  ownerScope = 'all',
  payload,
  searchQuery,
  user,
}: {
  commercialOnly?: boolean
  demoMode?: boolean
  ownerScope?: CrmWorkspaceOwnerScope
  payload: Payload
  searchQuery?: string
  user: User
}): Promise<CrmWorkspaceData> {
  const demoAccountIds =
    demoMode && isAdminUser(user) ? await resolveDemoAccountIds(payload, user) : null

  const context: WorkspaceContext = {
    commercialOnly,
    demoAccountIds,
    now: new Date(),
    ownerScope,
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
    commercialOnly,
    generatedAt: context.now.toISOString(),
    metrics,
    ownerScope,
    queues: [attention, pipeline, tasks, accounts, automation].map((queue) => ({
      ...queue,
      items: filterQueueItems({
        commercialOnly,
        items: queue.items,
        ownerScope,
        searchQuery,
        userId: String(user.id),
      }),
    })),
    searchQuery,
  }
}
