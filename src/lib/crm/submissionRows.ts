import { extractLeadFromSubmissionData } from '@/utilities/formSubmissionLead'

import type { SubmissionRow } from './types'

type NormalizedSubmissionRow = {
  field: string
  value: string
}

function normalizeField(value: string): string {
  return value.trim().toLowerCase()
}

export function normalizeSubmissionRows(rows: SubmissionRow[]): NormalizedSubmissionRow[] {
  return rows
    .filter((row): row is SubmissionRow => Boolean(row?.field))
    .map((row) => ({
      field: normalizeField(String(row.field)),
      value: String(row.value ?? '').trim(),
    }))
}

function firstNonEmpty(rows: NormalizedSubmissionRow[], fieldNames: string[]): string | null {
  for (const fieldName of fieldNames) {
    const match = rows.find((row) => row.field === fieldName)
    if (match?.value) return match.value
  }

  return null
}

export function getLeadEmailFromRows(rows: SubmissionRow[]): string | null {
  return extractLeadFromSubmissionData(rows)?.leadEmail ?? null
}

export function getLeadNameFromRows(rows: SubmissionRow[]): string | null {
  return extractLeadFromSubmissionData(rows)?.leadName ?? null
}

export function getLeadPhoneFromRows(rows: SubmissionRow[]): string | null {
  return firstNonEmpty(normalizeSubmissionRows(rows), ['phone', 'phone_number', 'mobile', 'cell'])
}

export function submissionRowsToPlaintext(rows: SubmissionRow[]): string {
  return normalizeSubmissionRows(rows)
    .filter((row) => row.value)
    .map((row) => `${row.field}: ${row.value}`)
    .join('\n')
}
