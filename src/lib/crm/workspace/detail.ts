import type { Payload, Where } from 'payload'

import type {
  Account,
  Contact,
  CrmActivity,
  CrmSequence,
  CrmTask,
  Lead,
  Opportunity,
  Quote,
  SequenceEnrollment,
  User,
} from '@/payload-types'

import {
  accountStatusLabel,
  accountTypeLabel,
  addressLabel,
  contactStatusLabel,
  formatCurrencyUsd,
  formatDateOnly,
  formatDateTime,
  leadSourceLabel,
  leadStatusLabel,
  nonEmptyParts,
  opportunityStageLabel,
  opportunityStatusLabel,
  ownerLabel,
  priorityLabel,
  sequenceAudienceLabel,
  sequenceDefinitionStatusLabel,
  sequenceEnrollmentStatusLabel,
  taskStatusLabel,
  taskTypeLabel,
} from './format'
import type { CrmRecordDetail, CrmRecordDetailRelatedItem, CrmRecordKind } from './types'

type DetailContext = {
  payload: Payload
  user: User
}

type RelatedCollection =
  | 'contacts'
  | 'crm-activities'
  | 'crm-tasks'
  | 'opportunities'
  | 'sequence-enrollments'

function recordHref(kind: CrmRecordKind, id: number): string {
  switch (kind) {
    case 'account':
      return `/admin/collections/accounts/${id}`
    case 'contact':
      return `/admin/collections/contacts/${id}`
    case 'lead':
      return `/admin/collections/leads/${id}`
    case 'opportunity':
      return `/admin/collections/opportunities/${id}`
    case 'sequence-definition':
      return `/admin/collections/crm-sequences/${id}`
    case 'sequence-enrollment':
      return `/admin/collections/sequence-enrollments/${id}`
    case 'task':
      return `/admin/collections/crm-tasks/${id}`
    default:
      return '/admin'
  }
}

async function findRelated<T>({
  collection,
  limit = 6,
  payload,
  sort = '-updatedAt',
  user,
  where,
}: {
  collection: RelatedCollection
  limit?: number
  payload: Payload
  sort?: string
  user: User
  where: Where
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

function relatedItem(input: CrmRecordDetailRelatedItem): CrmRecordDetailRelatedItem {
  return input
}

function quoteTitle(value: Quote | number | string | null | undefined): string | null {
  if (!value) return null
  if (typeof value === 'number' || typeof value === 'string') {
    return `Quote #${value}`
  }

  return value.title || `Quote #${value.id}`
}

function formatActivityItem(item: CrmActivity): CrmRecordDetailRelatedItem {
  return relatedItem({
    id: String(item.id),
    kind: 'task',
    meta: nonEmptyParts([formatDateTime(item.occurredAt), item.activityType]).join(' | '),
    title: item.title,
  })
}

function formatTaskItem(item: CrmTask): CrmRecordDetailRelatedItem {
  return relatedItem({
    id: String(item.id),
    kind: 'task',
    meta: nonEmptyParts([taskStatusLabel(item.status), formatDateOnly(item.dueAt)]).join(' | '),
    title: item.title,
  })
}

function formatOpportunityItem(item: Opportunity): CrmRecordDetailRelatedItem {
  return relatedItem({
    id: String(item.id),
    kind: 'opportunity',
    meta: nonEmptyParts([
      opportunityStageLabel(item.stage),
      typeof item.value === 'number' ? formatCurrencyUsd(item.value) : null,
    ]).join(' | '),
    title: item.title,
  })
}

function formatContactItem(item: Contact): CrmRecordDetailRelatedItem {
  return relatedItem({
    id: String(item.id),
    kind: 'contact',
    meta: nonEmptyParts([item.email, item.phone]).join(' | '),
    title: item.fullName,
  })
}

function formatEnrollmentItem(item: SequenceEnrollment): CrmRecordDetailRelatedItem {
  return relatedItem({
    id: String(item.id),
    kind: 'sequence-enrollment',
    meta: nonEmptyParts([sequenceEnrollmentStatusLabel(item.status), formatDateTime(item.nextRunAt)]).join(' | '),
    title: item.title,
  })
}

async function loadLeadDetail(context: DetailContext, id: number): Promise<CrmRecordDetail> {
  const lead = (await context.payload.findByID({
    collection: 'leads',
    depth: 1,
    id,
    overrideAccess: false,
    user: context.user,
  })) as Lead

  const [tasks, opportunities, activities] = await Promise.all([
    findRelated<CrmTask>({
      collection: 'crm-tasks',
      payload: context.payload,
      user: context.user,
      where: { lead: { equals: id } },
    }),
    findRelated<Opportunity>({
      collection: 'opportunities',
      payload: context.payload,
      user: context.user,
      where: { lead: { equals: id } },
    }),
    findRelated<CrmActivity>({
      collection: 'crm-activities',
      payload: context.payload,
      user: context.user,
      where: { lead: { equals: id } },
    }),
  ])

  return {
    badges: nonEmptyParts([lead.source ? leadSourceLabel(lead.source) : null]),
    description: lead.notes || lead.serviceSummary || null,
    fields: [
      { label: 'Customer', value: lead.customerName },
      { label: 'Email', value: lead.customerEmail || 'Not provided' },
      { label: 'Phone', value: lead.customerPhone || 'Not provided' },
      { label: 'Status', value: leadStatusLabel(lead.status) },
      { label: 'Priority', value: priorityLabel(lead.priority) },
      { label: 'Next action', value: formatDateTime(lead.nextActionAt) || 'Not scheduled' },
      { label: 'Service address', value: addressLabel(lead.serviceAddress) || 'Not captured' },
      { label: 'Quote', value: quoteTitle(lead.relatedQuote as Quote | number | string | null) || 'No quote yet' },
    ],
    href: recordHref('lead', id),
    id: String(lead.id),
    kind: 'lead',
    priorityLabel: priorityLabel(lead.priority),
    relatedSections: [
      { items: tasks.map(formatTaskItem), label: 'Open tasks' },
      { items: opportunities.map(formatOpportunityItem), label: 'Pipeline' },
      { items: activities.map(formatActivityItem), label: 'Recent activity' },
    ],
    statusLabel: leadStatusLabel(lead.status),
    subtitle: nonEmptyParts([lead.customerEmail, lead.customerPhone]).join(' | ') || 'Inbound lead',
    title: lead.title,
  }
}

async function loadContactDetail(context: DetailContext, id: number): Promise<CrmRecordDetail> {
  const contact = (await context.payload.findByID({
    collection: 'contacts',
    depth: 1,
    id,
    overrideAccess: false,
    user: context.user,
  })) as Contact

  const [tasks, opportunities, activities] = await Promise.all([
    findRelated<CrmTask>({
      collection: 'crm-tasks',
      payload: context.payload,
      user: context.user,
      where: { contact: { equals: id } },
    }),
    findRelated<Opportunity>({
      collection: 'opportunities',
      payload: context.payload,
      user: context.user,
      where: { contact: { equals: id } },
    }),
    findRelated<CrmActivity>({
      collection: 'crm-activities',
      payload: context.payload,
      user: context.user,
      where: { contact: { equals: id } },
    }),
  ])

  const accountName = typeof contact.account === 'object' ? contact.account?.name : null

  return {
    badges: contact.roles?.map((value) => value.replaceAll('_', ' ')) ?? [],
    description: contact.notes || null,
    fields: [
      { label: 'Email', value: contact.email },
      { label: 'Phone', value: contact.phone || 'Not provided' },
      { label: 'Account', value: accountName || 'No linked account' },
      { label: 'Status', value: contactStatusLabel(contact.status) },
      { label: 'Preferred contact', value: contact.preferredContactMethod?.replaceAll('_', ' ') || 'Any' },
      { label: 'Last contact', value: formatDateTime(contact.lastContactAt) || 'No activity yet' },
      { label: 'Next action', value: formatDateTime(contact.nextActionAt) || 'Not scheduled' },
    ],
    href: recordHref('contact', id),
    id: String(contact.id),
    kind: 'contact',
    relatedSections: [
      { items: tasks.map(formatTaskItem), label: 'Tasks' },
      { items: opportunities.map(formatOpportunityItem), label: 'Opportunities' },
      { items: activities.map(formatActivityItem), label: 'Recent activity' },
    ],
    statusLabel: contactStatusLabel(contact.status),
    subtitle: nonEmptyParts([accountName, ownerLabel(contact.owner as User | number | string | null)]).join(' | ')
      || 'CRM contact',
    title: contact.fullName,
  }
}

async function loadAccountDetail(context: DetailContext, id: number): Promise<CrmRecordDetail> {
  const account = (await context.payload.findByID({
    collection: 'accounts',
    depth: 1,
    id,
    overrideAccess: false,
    user: context.user,
  })) as Account

  const [contacts, opportunities, tasks, activities] = await Promise.all([
    findRelated<Contact>({
      collection: 'contacts',
      payload: context.payload,
      user: context.user,
      where: { account: { equals: id } },
    }),
    findRelated<Opportunity>({
      collection: 'opportunities',
      payload: context.payload,
      user: context.user,
      where: { account: { equals: id } },
    }),
    findRelated<CrmTask>({
      collection: 'crm-tasks',
      payload: context.payload,
      user: context.user,
      where: { account: { equals: id } },
    }),
    findRelated<CrmActivity>({
      collection: 'crm-activities',
      payload: context.payload,
      user: context.user,
      where: { account: { equals: id } },
    }),
  ])

  return {
    badges: nonEmptyParts([
      accountTypeLabel(account.accountType),
      typeof account.activeServicePlan === 'object' ? 'Plan active' : null,
      account.taxExempt ? 'Tax exempt' : null,
    ]),
    description: account.notes || account.serviceLocationSummary || null,
    fields: [
      { label: 'Status', value: accountStatusLabel(account.status) },
      { label: 'Owner', value: ownerLabel(account.owner as User | number | string | null) || 'Unassigned' },
      { label: 'Billing email', value: account.billingEmail || 'Not provided' },
      { label: 'AP email', value: account.accountsPayableEmail || 'Not provided' },
      { label: 'AP phone', value: account.accountsPayablePhone || 'Not provided' },
      { label: 'Billing terms', value: account.billingTerms?.replaceAll('_', ' ') || 'Not set' },
      {
        label: 'Locations',
        value: typeof account.locationCount === 'number' ? String(account.locationCount) : '1',
      },
      { label: 'Tax exempt', value: account.taxExempt ? 'Yes' : 'No' },
      { label: 'Tax exemption ref', value: account.taxExemptionReference || 'Not provided' },
      { label: 'Service address', value: addressLabel(account.serviceAddress) || 'Not captured' },
      { label: 'Billing address', value: addressLabel(account.billingAddress) || 'Not captured' },
      {
        label: 'Primary contact',
        value: typeof account.primaryContact === 'object' ? account.primaryContact?.fullName || 'Not set' : 'Not set',
      },
      {
        label: 'Active quote',
        value: quoteTitle(account.activeQuote as Quote | number | string | null) || 'No active quote',
      },
      {
        label: 'Service plan',
        value:
          typeof account.activeServicePlan === 'object'
            ? account.activeServicePlan?.title || 'Linked'
            : account.activeServicePlan
              ? `Plan #${account.activeServicePlan}`
              : 'No active plan',
      },
      {
        label: 'Customer login',
        value: typeof account.customerUser === 'object' ? account.customerUser?.email || 'Linked' : 'Not linked',
      },
    ],
    href: recordHref('account', id),
    id: String(account.id),
    kind: 'account',
    relatedSections: [
      { items: contacts.map(formatContactItem), label: 'Contacts' },
      { items: opportunities.map(formatOpportunityItem), label: 'Opportunities' },
      { items: tasks.map(formatTaskItem), label: 'Tasks' },
      { items: activities.map(formatActivityItem), label: 'Recent activity' },
    ],
    statusLabel: accountStatusLabel(account.status),
    subtitle: nonEmptyParts([account.legalName, ownerLabel(account.owner as User | number | string | null)]).join(' | ')
      || 'Customer account',
    title: account.name,
  }
}

async function loadOpportunityDetail(context: DetailContext, id: number): Promise<CrmRecordDetail> {
  const opportunity = (await context.payload.findByID({
    collection: 'opportunities',
    depth: 1,
    id,
    overrideAccess: false,
    user: context.user,
  })) as Opportunity

  const [tasks, activities] = await Promise.all([
    findRelated<CrmTask>({
      collection: 'crm-tasks',
      payload: context.payload,
      user: context.user,
      where: { opportunity: { equals: id } },
    }),
    findRelated<CrmActivity>({
      collection: 'crm-activities',
      payload: context.payload,
      user: context.user,
      where: { opportunity: { equals: id } },
    }),
  ])

  return {
    badges: nonEmptyParts([opportunity.stage ? opportunityStageLabel(opportunity.stage) : null]),
    description: opportunity.notes || opportunity.closeReason || null,
    fields: [
      { label: 'Status', value: opportunityStatusLabel(opportunity.status) },
      { label: 'Stage', value: opportunityStageLabel(opportunity.stage) },
      { label: 'Priority', value: priorityLabel(opportunity.priority) },
      { label: 'Owner', value: ownerLabel(opportunity.owner as User | number | string | null) || 'Unassigned' },
      { label: 'Value', value: typeof opportunity.value === 'number' ? formatCurrencyUsd(opportunity.value) : 'Not quoted' },
      { label: 'Expected close', value: formatDateOnly(opportunity.expectedCloseDate) || 'Not scheduled' },
      { label: 'Next action', value: opportunity.nextAction || 'Not set' },
      { label: 'Next action at', value: formatDateTime(opportunity.nextActionAt) || 'Not scheduled' },
      { label: 'Quote', value: quoteTitle(opportunity.quote as Quote | number | string | null) || 'No quote' },
    ],
    href: recordHref('opportunity', id),
    id: String(opportunity.id),
    kind: 'opportunity',
    priorityLabel: priorityLabel(opportunity.priority),
    relatedSections: [
      { items: tasks.map(formatTaskItem), label: 'Tasks' },
      { items: activities.map(formatActivityItem), label: 'Recent activity' },
    ],
    statusLabel: opportunityStatusLabel(opportunity.status),
    subtitle:
      nonEmptyParts([
        typeof opportunity.account === 'object' ? opportunity.account?.name : null,
        typeof opportunity.contact === 'object' ? opportunity.contact?.fullName : null,
      ]).join(' | ') || 'Pipeline record',
    title: opportunity.title,
  }
}

async function loadTaskDetail(context: DetailContext, id: number): Promise<CrmRecordDetail> {
  const task = (await context.payload.findByID({
    collection: 'crm-tasks',
    depth: 1,
    id,
    overrideAccess: false,
    user: context.user,
  })) as CrmTask

  const activities = await findRelated<CrmActivity>({
    collection: 'crm-activities',
    payload: context.payload,
    user: context.user,
    where: { relatedTask: { equals: id } },
  })

  return {
    badges: nonEmptyParts([task.taskType ? taskTypeLabel(task.taskType) : null]),
    description: task.notes || null,
    fields: [
      { label: 'Status', value: taskStatusLabel(task.status) },
      { label: 'Priority', value: priorityLabel(task.priority) },
      { label: 'Due', value: formatDateTime(task.dueAt) || 'No due date' },
      { label: 'Completed', value: formatDateTime(task.completedAt) || 'Open' },
      { label: 'Owner', value: ownerLabel(task.owner as User | number | string | null) || 'Unassigned' },
      { label: 'Lead', value: typeof task.lead === 'object' ? task.lead?.title || 'Linked' : 'Not linked' },
      {
        label: 'Opportunity',
        value: typeof task.opportunity === 'object' ? task.opportunity?.title || 'Linked' : 'Not linked',
      },
      { label: 'Account', value: typeof task.account === 'object' ? task.account?.name || 'Linked' : 'Not linked' },
    ],
    href: recordHref('task', id),
    id: String(task.id),
    kind: 'task',
    priorityLabel: priorityLabel(task.priority),
    relatedSections: [{ items: activities.map(formatActivityItem), label: 'Recent activity' }],
    statusLabel: taskStatusLabel(task.status),
    subtitle:
      nonEmptyParts([
        typeof task.contact === 'object' ? task.contact?.fullName : null,
        typeof task.account === 'object' ? task.account?.name : null,
      ]).join(' | ') || 'CRM task',
    title: task.title,
  }
}

async function loadSequenceDefinitionDetail(context: DetailContext, id: number): Promise<CrmRecordDetail> {
  const sequence = (await context.payload.findByID({
    collection: 'crm-sequences',
    depth: 1,
    id,
    overrideAccess: false,
    user: context.user,
  })) as CrmSequence

  const enrollments = await findRelated<SequenceEnrollment>({
    collection: 'sequence-enrollments',
    payload: context.payload,
    user: context.user,
    where: { sequenceDefinition: { equals: id } },
  })

  return {
    badges: nonEmptyParts([sequence.audience ? sequenceAudienceLabel(sequence.audience) : null]),
    description: sequence.notes || null,
    fields: [
      { label: 'Status', value: sequenceDefinitionStatusLabel(sequence.status) },
      { label: 'Key', value: sequence.key },
      { label: 'Trigger', value: sequence.trigger?.replaceAll('_', ' ') || 'Manual' },
      { label: 'Business days', value: sequence.settings?.businessDaysOnly ? 'Yes' : 'No' },
      { label: 'Stop on reply', value: sequence.settings?.stopOnReply ? 'Yes' : 'No' },
      {
        label: 'Send window',
        value: `${sequence.settings?.sendWindowStartHour ?? 8}:00-${sequence.settings?.sendWindowEndHour ?? 18}:00`,
      },
      { label: 'Steps', value: `${sequence.steps?.length ?? 0}` },
      { label: 'Owner', value: ownerLabel(sequence.owner as User | number | string | null) || 'Unassigned' },
    ],
    href: recordHref('sequence-definition', id),
    id: String(sequence.id),
    kind: 'sequence-definition',
    relatedSections: [{ items: enrollments.map(formatEnrollmentItem), label: 'Enrollments' }],
    statusLabel: sequenceDefinitionStatusLabel(sequence.status),
    subtitle: 'In-app automation definition',
    title: sequence.name,
  }
}

async function loadSequenceEnrollmentDetail(context: DetailContext, id: number): Promise<CrmRecordDetail> {
  const enrollment = (await context.payload.findByID({
    collection: 'sequence-enrollments',
    depth: 1,
    id,
    overrideAccess: false,
    user: context.user,
  })) as SequenceEnrollment

  return {
    badges: nonEmptyParts([
      typeof enrollment.sequenceDefinition === 'object' ? enrollment.sequenceDefinition?.name : enrollment.sequenceKey,
    ]),
    description: enrollment.lastError || enrollment.exitReason || null,
    fields: [
      { label: 'Status', value: sequenceEnrollmentStatusLabel(enrollment.status) },
      { label: 'Sequence key', value: enrollment.sequenceKey },
      { label: 'Step', value: String(enrollment.stepIndex + 1) },
      { label: 'Next run', value: formatDateTime(enrollment.nextRunAt) || 'Not scheduled' },
      { label: 'Last run', value: formatDateTime(enrollment.lastRunAt) || 'Not run yet' },
      { label: 'Account', value: typeof enrollment.account === 'object' ? enrollment.account?.name || 'Linked' : 'Not linked' },
      { label: 'Contact', value: typeof enrollment.contact === 'object' ? enrollment.contact?.fullName || 'Linked' : 'Not linked' },
      {
        label: 'Opportunity',
        value: typeof enrollment.opportunity === 'object' ? enrollment.opportunity?.title || 'Linked' : 'Not linked',
      },
    ],
    href: recordHref('sequence-enrollment', id),
    id: String(enrollment.id),
    kind: 'sequence-enrollment',
    relatedSections: [],
    statusLabel: sequenceEnrollmentStatusLabel(enrollment.status),
    subtitle: 'Live sequence enrollment',
    title: enrollment.title,
  }
}

export async function loadCrmRecordDetail({
  id,
  payload,
  type,
  user,
}: {
  id: number
  payload: Payload
  type: CrmRecordKind
  user: User
}): Promise<CrmRecordDetail> {
  const context: DetailContext = {
    payload,
    user,
  }

  switch (type) {
    case 'lead':
      return loadLeadDetail(context, id)
    case 'contact':
      return loadContactDetail(context, id)
    case 'account':
      return loadAccountDetail(context, id)
    case 'opportunity':
      return loadOpportunityDetail(context, id)
    case 'task':
      return loadTaskDetail(context, id)
    case 'sequence-definition':
      return loadSequenceDefinitionDetail(context, id)
    case 'sequence-enrollment':
      return loadSequenceEnrollmentDetail(context, id)
    default:
      throw new Error(`Unsupported CRM record detail type: ${String(type)}`)
  }
}
