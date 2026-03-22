import type { CollectionBeforeChangeHook } from 'payload'

import { extractLeadFromSubmissionData } from '@/utilities/formSubmissionLead'

/**
 * Populates `leadEmail` / `leadName` from `submissionData` for admin list columns and filtering.
 */
export const beforeFormSubmissionNormalize: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
}) => {
  const rows =
    data.submissionData ??
    (operation === 'update' && originalDoc && 'submissionData' in originalDoc
      ? (originalDoc as { submissionData?: { field: string; value: string }[] }).submissionData
      : undefined)

  const { leadEmail, leadName } = extractLeadFromSubmissionData(rows)

  return {
    ...data,
    leadEmail: leadEmail ?? null,
    leadName: leadName ?? null,
  }
}
