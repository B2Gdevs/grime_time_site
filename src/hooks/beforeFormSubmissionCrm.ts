import type { CollectionBeforeChangeHook } from 'payload'

import { syncFormSubmissionToActiveCrm } from '@/lib/crm'
import type { SubmissionRow } from '@/lib/crm/types'
import type { FormSubmission } from '@/payload-types'

function nowIso(): string {
  return new Date().toISOString()
}

type CrmSyncStatus = NonNullable<FormSubmission['crmSyncStatus']>

type CrmMetadata = {
  crmSyncDetail: string | null
  crmSyncStatus: CrmSyncStatus
  crmSyncedAt: string
}

function withCrmMetadata<T extends Record<string, unknown>>(data: T, crm: CrmMetadata): T & CrmMetadata {
  return {
    ...data,
    crmSyncDetail: crm.crmSyncDetail,
    crmSyncStatus: crm.crmSyncStatus,
    crmSyncedAt: crm.crmSyncedAt,
  }
}

export const beforeFormSubmissionCrm: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data

  const rows = data.submissionData as SubmissionRow[] | undefined
  const crmSyncedAt = nowIso()

  if (!Array.isArray(rows) || rows.length === 0) {
    return withCrmMetadata(data, {
      crmSyncDetail: null,
      crmSyncStatus: 'skipped_no_rows',
      crmSyncedAt,
    })
  }

  try {
    const result = await syncFormSubmissionToActiveCrm(rows)

    if (result.status === 'failed' || result.status === 'failed_contact') {
      req.payload.logger.error(
        { detail: result.detail },
        'Lead follow-up metadata failed during form submission create path',
      )
    }

    return withCrmMetadata(data, {
      crmSyncDetail: result.detail,
      crmSyncStatus: result.status,
      crmSyncedAt,
    })
  } catch (error) {
    req.payload.logger.error({ err: error }, 'Lead follow-up metadata error')

    return withCrmMetadata(data, {
      crmSyncDetail: error instanceof Error ? error.message.slice(0, 400) : 'unknown error',
      crmSyncStatus: 'failed',
      crmSyncedAt,
    })
  }
}
