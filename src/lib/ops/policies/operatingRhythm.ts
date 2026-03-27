export const OPERATING_ROLE_OPTIONS = [
  { label: 'Field tech', value: 'field-tech' },
  { label: 'Lead follow-up', value: 'lead-followup' },
  { label: 'Scheduler', value: 'scheduler' },
  { label: 'Billing follow-up', value: 'billing-followup' },
  { label: 'Ops admin', value: 'ops-admin' },
] as const

export type OperatingRoleTag = (typeof OPERATING_ROLE_OPTIONS)[number]['value']

export const CRM_TASK_SOURCE_TYPE_OPTIONS = [
  { label: 'Lead', value: 'lead' },
  { label: 'Quote', value: 'quote' },
  { label: 'Appointment', value: 'appointment' },
  { label: 'Invoice', value: 'invoice' },
  { label: 'Sequence', value: 'sequence' },
  { label: 'Support', value: 'support' },
  { label: 'Manual', value: 'manual' },
] as const

export type CrmTaskSourceType = (typeof CRM_TASK_SOURCE_TYPE_OPTIONS)[number]['value']

export const CRM_TASK_SLA_CLASS_OPTIONS = [
  { label: 'New lead', value: 'new_lead' },
  { label: 'Quote follow-up', value: 'quote_follow_up' },
  { label: 'Scheduling', value: 'scheduling' },
  { label: 'Billing support', value: 'billing_support' },
  { label: 'Refund request', value: 'refund_request' },
  { label: 'Policy or privacy request', value: 'policy_privacy' },
  { label: 'General support', value: 'general_support' },
  { label: 'Invoice overdue', value: 'invoice_overdue' },
  { label: 'Sequence task', value: 'sequence_task' },
  { label: 'Manual follow-up', value: 'manual_follow_up' },
] as const

export type CrmTaskSlaClass = (typeof CRM_TASK_SLA_CLASS_OPTIONS)[number]['value']

type OperatingRhythmRule = {
  acknowledgmentBusinessDays?: number
  acknowledgmentBusinessMinutes?: number
  escalationBusinessDays: number
  nextAction: string
  priority: 'high' | 'low' | 'medium' | 'urgent'
  roleTags: OperatingRoleTag[]
  slaClass: CrmTaskSlaClass
  sourceType: CrmTaskSourceType
  staleBusinessDays: number
}

export type OperatingRhythmTiming = {
  dueAt: string
  escalatesAt: string
  slaTargetAt: string
  staleAt: string
}

export type OperatingRhythmPolicy = OperatingRhythmRule & OperatingRhythmTiming

export const OPERATING_DUTY_SUMMARIES = {
  billing: {
    rhythm:
      'Work overdue invoices first, then anything due today, then send-ready invoices. Refund or policy exceptions escalate to ops-admin on the same business day.',
    roles: ['billing-followup', 'ops-admin'] as OperatingRoleTag[],
  },
  crm: {
    rhythm:
      'Clear stale contacts and hot leads first, then open quote follow-up, then anything newly unassigned. No item should end the day without owner, next action, and due date.',
    roles: ['lead-followup', 'ops-admin'] as OperatingRoleTag[],
  },
  today: {
    rhythm:
      'Confirm the current route first, then reschedules and requested windows, then tomorrow prep. Scheduling exceptions should leave the queue with a confirmed next step.',
    roles: ['scheduler', 'field-tech'] as OperatingRoleTag[],
  },
} as const

type BuildOperatingRhythmPolicyArgs = {
  now?: Date
  rule: OperatingRhythmRule
}

const BUSINESS_START_HOUR = 8
const BUSINESS_START_MINUTE = 30
const BUSINESS_END_HOUR = 17

function cloneDate(value: Date): Date {
  return new Date(value.getTime())
}

function isBusinessDay(value: Date): boolean {
  const day = value.getUTCDay()
  return day !== 0 && day !== 6
}

function setBusinessStart(value: Date): Date {
  const next = cloneDate(value)
  next.setUTCHours(BUSINESS_START_HOUR, BUSINESS_START_MINUTE, 0, 0)
  return next
}

function setBusinessEnd(value: Date): Date {
  const next = cloneDate(value)
  next.setUTCHours(BUSINESS_END_HOUR, 0, 0, 0)
  return next
}

function nextBusinessStart(value: Date): Date {
  let next = setBusinessStart(value)

  while (!isBusinessDay(next)) {
    next = new Date(next.getTime() + 24 * 60 * 60 * 1000)
    next = setBusinessStart(next)
  }

  return next
}

function normalizeBusinessCursor(value: Date): Date {
  let next = cloneDate(value)

  if (!isBusinessDay(next)) {
    return nextBusinessStart(next)
  }

  const businessStart = setBusinessStart(next)
  const businessEnd = setBusinessEnd(next)

  if (next.getTime() < businessStart.getTime()) {
    return businessStart
  }

  if (next.getTime() >= businessEnd.getTime()) {
    return nextBusinessStart(new Date(next.getTime() + 24 * 60 * 60 * 1000))
  }

  return next
}

function addBusinessMinutes(value: Date, minutes: number): Date {
  let cursor = normalizeBusinessCursor(value)
  let remaining = Math.max(0, minutes)

  while (remaining > 0) {
    const businessEnd = setBusinessEnd(cursor)
    const availableMinutes = Math.max(0, Math.floor((businessEnd.getTime() - cursor.getTime()) / 60000))

    if (availableMinutes === 0) {
      cursor = nextBusinessStart(new Date(cursor.getTime() + 24 * 60 * 60 * 1000))
      continue
    }

    const slice = Math.min(remaining, availableMinutes)
    cursor = new Date(cursor.getTime() + slice * 60000)
    remaining -= slice

    if (remaining > 0) {
      cursor = nextBusinessStart(new Date(cursor.getTime() + 24 * 60 * 60 * 1000))
    }
  }

  return cursor
}

function addBusinessDays(value: Date, days: number): Date {
  let cursor = normalizeBusinessCursor(value)
  let remaining = Math.max(0, days)

  while (remaining > 0) {
    cursor = nextBusinessStart(new Date(cursor.getTime() + 24 * 60 * 60 * 1000))
    remaining -= 1
  }

  return cursor
}

export function buildOperatingRhythmPolicy(args: BuildOperatingRhythmPolicyArgs): OperatingRhythmPolicy {
  const now = args.now ? cloneDate(args.now) : new Date()
  const base = normalizeBusinessCursor(now)
  const dueAt =
    typeof args.rule.acknowledgmentBusinessMinutes === 'number'
      ? addBusinessMinutes(base, args.rule.acknowledgmentBusinessMinutes)
      : addBusinessDays(base, args.rule.acknowledgmentBusinessDays ?? 1)

  const staleAt = addBusinessDays(dueAt, args.rule.staleBusinessDays)
  const escalatesAt = addBusinessDays(dueAt, args.rule.escalationBusinessDays)

  return {
    ...args.rule,
    dueAt: dueAt.toISOString(),
    escalatesAt: escalatesAt.toISOString(),
    slaTargetAt: dueAt.toISOString(),
    staleAt: staleAt.toISOString(),
  }
}

export function roleTagLabel(value: null | OperatingRoleTag | undefined): string {
  return OPERATING_ROLE_OPTIONS.find((option) => option.value === value)?.label ?? 'Unknown role'
}

export function slaClassLabel(value: CrmTaskSlaClass | null | undefined): string {
  return CRM_TASK_SLA_CLASS_OPTIONS.find((option) => option.value === value)?.label ?? 'Unclassified SLA'
}

export function sourceTypeLabel(value: CrmTaskSourceType | null | undefined): string {
  return CRM_TASK_SOURCE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? 'Manual'
}
