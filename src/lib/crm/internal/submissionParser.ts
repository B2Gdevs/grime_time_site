import type { SubmissionRow } from '@/lib/crm/types'
import { normalizeSubmissionRows, submissionRowsToPlaintext } from '@/lib/crm/submissionRows'

type ParsedSubmission = {
  accountType: 'commercial' | 'residential'
  customerEmail: null | string
  customerName: null | string
  customerPhone: null | string
  notes: null | string
  plaintext: string
  preferredReply: null | string
  priority: 'high' | 'medium'
  propertyAddress: null | string
  propertyType: null | string
  requestKind:
    | 'billing_support'
    | 'general_support'
    | 'policy_privacy'
    | 'refund_request'
    | 'sales'
    | 'scheduling_support'
    | 'service_follow_up'
  serviceType: null | string
  shouldCreateOpportunity: boolean
  source: 'contact_request' | 'instant_quote' | 'manual' | 'schedule_request'
  staleDays: number
  targetDate: null | string
  title: string
}

function firstValue(rows: ReturnType<typeof normalizeSubmissionRows>, fieldNames: string[]): null | string {
  for (const fieldName of fieldNames) {
    const match = rows.find((row) => row.field === fieldName)
    if (match?.value) return match.value
  }

  return null
}

function normalizeSource(value: null | string): ParsedSubmission['source'] {
  if (value === 'instant_quote') return 'instant_quote'
  if (value === 'schedule_request') return 'schedule_request'
  if (value === 'contact_request') return 'contact_request'
  return 'manual'
}

function inferAccountType(args: {
  propertyType: null | string
  serviceType: null | string
  source: ParsedSubmission['source']
}): ParsedSubmission['accountType'] {
  const propertyType = args.propertyType?.toLowerCase() ?? ''
  const serviceType = args.serviceType?.toLowerCase() ?? ''

  if (propertyType.includes('commercial') || serviceType.includes('commercial')) {
    return 'commercial'
  }

  return args.source === 'schedule_request' && serviceType.includes('walkthrough')
    ? 'commercial'
    : 'residential'
}

function inferPriority(source: ParsedSubmission['source'], accountType: ParsedSubmission['accountType']) {
  if (accountType === 'commercial') return 'high'
  if (source === 'instant_quote' || source === 'schedule_request') return 'high'
  return 'medium'
}

function inferRequestKind(args: {
  notes: null | string
  schedulingRequested: boolean
  serviceType: null | string
  source: ParsedSubmission['source']
}): ParsedSubmission['requestKind'] {
  const serviceType = args.serviceType?.toLowerCase() ?? ''
  const notes = args.notes?.toLowerCase() ?? ''

  if (args.source === 'instant_quote' && args.schedulingRequested) return 'scheduling_support'
  if (args.source === 'instant_quote') return 'sales'
  if (args.source === 'schedule_request') return 'scheduling_support'
  if (serviceType.includes('billing or refund')) {
    return notes.includes('refund') || notes.includes('credit') ? 'refund_request' : 'billing_support'
  }
  if (serviceType.includes('privacy') || serviceType.includes('policy') || serviceType.includes('terms')) {
    return 'policy_privacy'
  }
  if (serviceType.includes('existing service follow-up')) return 'service_follow_up'
  if (serviceType.includes('scheduling question')) return 'scheduling_support'
  if (serviceType.includes('general question')) return 'general_support'
  return 'sales'
}

function inferStaleDays(args: {
  accountType: ParsedSubmission['accountType']
  requestKind: ParsedSubmission['requestKind']
  source: ParsedSubmission['source']
}) {
  if (args.accountType === 'commercial') return 1
  if (args.source === 'instant_quote' || args.source === 'schedule_request') return 1
  if (args.requestKind === 'policy_privacy' || args.requestKind === 'refund_request') return 1
  return 2
}

function shouldCreateOpportunity(args: {
  accountType: ParsedSubmission['accountType']
  requestKind: ParsedSubmission['requestKind']
  source: ParsedSubmission['source']
}) {
  if (args.accountType === 'commercial') return true
  if (args.source === 'instant_quote' || args.source === 'schedule_request') return true
  return args.requestKind === 'sales'
}

function isSchedulingRequestedFlag(value: null | string) {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'yes' || normalized === 'true'
}

export function parseSubmissionRows(rows: SubmissionRow[]): ParsedSubmission {
  const normalizedRows = normalizeSubmissionRows(rows)
  const source = normalizeSource(firstValue(normalizedRows, ['leadsource']))
  const propertyType = firstValue(normalizedRows, ['propertytype'])
  const serviceType = firstValue(normalizedRows, ['servicetype'])
  const schedulingRequested = isSchedulingRequestedFlag(
    firstValue(normalizedRows, ['schedulingrequested']),
  )
  const accountType = inferAccountType({
    propertyType,
    serviceType,
    source,
  })
  const details = firstValue(normalizedRows, ['details'])
  const schedulingNotes = firstValue(normalizedRows, ['notes'])
  const message = firstValue(normalizedRows, ['message'])
  const notes =
    [details, schedulingNotes, message].filter(Boolean).join('\n\n') ||
    firstValue(normalizedRows, ['estimatedrange'])
  const requestKind = inferRequestKind({
    notes,
    schedulingRequested,
    serviceType,
    source,
  })
  const customerName = firstValue(normalizedRows, ['fullname', 'name', 'firstname'])
  const titleService = serviceType ?? 'new request'

  return {
    accountType,
    customerEmail: firstValue(normalizedRows, ['email']),
    customerName,
    customerPhone: firstValue(normalizedRows, ['phone', 'phone_number', 'mobile', 'cell']),
    notes,
    plaintext: submissionRowsToPlaintext(rows),
    preferredReply: firstValue(normalizedRows, ['preferredreply']),
    priority: inferPriority(source, accountType),
    propertyAddress: firstValue(normalizedRows, ['propertyaddress', 'address']),
    propertyType,
    requestKind,
    serviceType,
    shouldCreateOpportunity: shouldCreateOpportunity({
      accountType,
      requestKind,
      source,
    }),
    source,
    staleDays: inferStaleDays({
      accountType,
      requestKind,
      source,
    }),
    targetDate: firstValue(normalizedRows, ['targetdate']),
    title: customerName ? `${customerName} - ${titleService}` : `Lead - ${titleService}`,
  }
}

export type { ParsedSubmission }
