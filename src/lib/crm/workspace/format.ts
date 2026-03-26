import {
  CRM_ACCOUNT_STATUS_OPTIONS,
  CRM_ACCOUNT_TYPE_OPTIONS,
  CRM_CONTACT_STATUS_OPTIONS,
  CRM_LEAD_SOURCE_OPTIONS,
  CRM_LEAD_STATUS_OPTIONS,
  CRM_OPPORTUNITY_STAGE_OPTIONS,
  CRM_OPPORTUNITY_STATUS_OPTIONS,
  CRM_PRIORITY_OPTIONS,
  CRM_SEQUENCE_AUDIENCE_OPTIONS,
  CRM_SEQUENCE_DEFINITION_STATUS_OPTIONS,
  CRM_SEQUENCE_STATUS_OPTIONS,
  CRM_TASK_STATUS_OPTIONS,
  CRM_TASK_TYPE_OPTIONS,
} from '@/lib/crm/schema'
import type { User } from '@/payload-types'

const PRIORITY_LABELS = Object.fromEntries(CRM_PRIORITY_OPTIONS.map((item) => [item.value, item.label]))
const LEAD_STATUS_LABELS = Object.fromEntries(CRM_LEAD_STATUS_OPTIONS.map((item) => [item.value, item.label]))
const LEAD_SOURCE_LABELS = Object.fromEntries(CRM_LEAD_SOURCE_OPTIONS.map((item) => [item.value, item.label]))
const CONTACT_STATUS_LABELS = Object.fromEntries(
  CRM_CONTACT_STATUS_OPTIONS.map((item) => [item.value, item.label]),
)
const ACCOUNT_STATUS_LABELS = Object.fromEntries(
  CRM_ACCOUNT_STATUS_OPTIONS.map((item) => [item.value, item.label]),
)
const ACCOUNT_TYPE_LABELS = Object.fromEntries(CRM_ACCOUNT_TYPE_OPTIONS.map((item) => [item.value, item.label]))
const OPPORTUNITY_STATUS_LABELS = Object.fromEntries(
  CRM_OPPORTUNITY_STATUS_OPTIONS.map((item) => [item.value, item.label]),
)
const OPPORTUNITY_STAGE_LABELS = Object.fromEntries(
  CRM_OPPORTUNITY_STAGE_OPTIONS.map((item) => [item.value, item.label]),
)
const TASK_STATUS_LABELS = Object.fromEntries(CRM_TASK_STATUS_OPTIONS.map((item) => [item.value, item.label]))
const TASK_TYPE_LABELS = Object.fromEntries(CRM_TASK_TYPE_OPTIONS.map((item) => [item.value, item.label]))
const SEQUENCE_STATUS_LABELS = Object.fromEntries(
  CRM_SEQUENCE_STATUS_OPTIONS.map((item) => [item.value, item.label]),
)
const SEQUENCE_DEFINITION_STATUS_LABELS = Object.fromEntries(
  CRM_SEQUENCE_DEFINITION_STATUS_OPTIONS.map((item) => [item.value, item.label]),
)
const SEQUENCE_AUDIENCE_LABELS = Object.fromEntries(
  CRM_SEQUENCE_AUDIENCE_OPTIONS.map((item) => [item.value, item.label]),
)

export function formatCurrencyUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

export function formatDateTime(value: null | string | undefined): string | null {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatDateOnly(value: null | string | undefined): string | null {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(date)
}

export function isPastDue(value: null | string | undefined, now = new Date()): boolean {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() <= now.getTime()
}

export function isOlderThanDays(value: null | string | undefined, days: number, now = new Date()): boolean {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date.getTime() <= now.getTime() - days * 24 * 60 * 60 * 1000
}

export function nonEmptyParts(parts: Array<null | string | undefined>): string[] {
  return parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part))
}

export function priorityRank(value: null | string | undefined): number {
  switch (value) {
    case 'urgent':
      return 4
    case 'high':
      return 3
    case 'medium':
      return 2
    case 'low':
      return 1
    default:
      return 0
  }
}

function labelFromMap(map: Record<string, string>, value: null | string | undefined, fallback = 'Unknown'): string {
  if (!value) return fallback
  return map[value] ?? fallback
}

export function priorityLabel(value: null | string | undefined): string {
  return labelFromMap(PRIORITY_LABELS, value, 'Unranked')
}

export function leadStatusLabel(value: null | string | undefined): string {
  return labelFromMap(LEAD_STATUS_LABELS, value)
}

export function leadSourceLabel(value: null | string | undefined): string {
  return labelFromMap(LEAD_SOURCE_LABELS, value)
}

export function contactStatusLabel(value: null | string | undefined): string {
  return labelFromMap(CONTACT_STATUS_LABELS, value)
}

export function accountStatusLabel(value: null | string | undefined): string {
  return labelFromMap(ACCOUNT_STATUS_LABELS, value)
}

export function accountTypeLabel(value: null | string | undefined): string {
  return labelFromMap(ACCOUNT_TYPE_LABELS, value)
}

export function opportunityStatusLabel(value: null | string | undefined): string {
  return labelFromMap(OPPORTUNITY_STATUS_LABELS, value)
}

export function opportunityStageLabel(value: null | string | undefined): string {
  return labelFromMap(OPPORTUNITY_STAGE_LABELS, value)
}

export function taskStatusLabel(value: null | string | undefined): string {
  return labelFromMap(TASK_STATUS_LABELS, value)
}

export function taskTypeLabel(value: null | string | undefined): string {
  return labelFromMap(TASK_TYPE_LABELS, value)
}

export function sequenceEnrollmentStatusLabel(value: null | string | undefined): string {
  return labelFromMap(SEQUENCE_STATUS_LABELS, value)
}

export function sequenceDefinitionStatusLabel(value: null | string | undefined): string {
  return labelFromMap(SEQUENCE_DEFINITION_STATUS_LABELS, value)
}

export function sequenceAudienceLabel(value: null | string | undefined): string {
  return labelFromMap(SEQUENCE_AUDIENCE_LABELS, value)
}

export function ownerLabel(value: null | number | string | User | undefined): string | null {
  if (!value) return null
  if (typeof value === 'number' || typeof value === 'string') {
    return `Owner #${value}`
  }

  if (typeof value.email === 'string' && value.email.trim()) {
    return value.email
  }

  return null
}

export function addressLabel(value: {
  city?: null | string
  postalCode?: null | string
  state?: null | string
  street1?: null | string
  street2?: null | string
} | null | undefined): string | null {
  if (!value) return null

  const line1 = nonEmptyParts([value.street1, value.street2]).join(', ')
  const line2 = nonEmptyParts([value.city, value.state, value.postalCode]).join(' ')
  const joined = nonEmptyParts([line1, line2]).join(', ')

  return joined || null
}
