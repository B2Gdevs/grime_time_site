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

function inferStaleDays(source: ParsedSubmission['source'], accountType: ParsedSubmission['accountType']) {
  if (accountType === 'commercial') return 1
  if (source === 'instant_quote' || source === 'schedule_request') return 1
  return 2
}

function shouldCreateOpportunity(args: {
  accountType: ParsedSubmission['accountType']
  serviceType: null | string
  source: ParsedSubmission['source']
}) {
  if (args.accountType === 'commercial') return true
  if (args.source === 'instant_quote' || args.source === 'schedule_request') return true

  const serviceType = args.serviceType?.toLowerCase() ?? ''
  return ![
    'general question',
    'existing service follow-up',
    'billing or refund question',
    'privacy or data request',
    'terms or policy question',
    'scheduling question',
  ].includes(serviceType)
}

export function parseSubmissionRows(rows: SubmissionRow[]): ParsedSubmission {
  const normalizedRows = normalizeSubmissionRows(rows)
  const source = normalizeSource(firstValue(normalizedRows, ['leadsource']))
  const propertyType = firstValue(normalizedRows, ['propertytype'])
  const serviceType = firstValue(normalizedRows, ['servicetype'])
  const accountType = inferAccountType({
    propertyType,
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
    notes:
      firstValue(normalizedRows, ['message', 'details', 'notes']) ??
      firstValue(normalizedRows, ['estimatedrange']),
    plaintext: submissionRowsToPlaintext(rows),
    preferredReply: firstValue(normalizedRows, ['preferredreply']),
    priority: inferPriority(source, accountType),
    propertyAddress: firstValue(normalizedRows, ['propertyaddress', 'address']),
    propertyType,
    serviceType,
    shouldCreateOpportunity: shouldCreateOpportunity({
      accountType,
      serviceType,
      source,
    }),
    source,
    staleDays: inferStaleDays(source, accountType),
    targetDate: firstValue(normalizedRows, ['targetdate']),
    title: customerName ? `${customerName} - ${titleService}` : `Lead - ${titleService}`,
  }
}

export type { ParsedSubmission }
