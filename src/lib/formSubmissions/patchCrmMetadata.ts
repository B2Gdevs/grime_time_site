import type { Payload, PayloadRequest } from 'payload'

import type { FormSubmission } from '@/payload-types'

export type FormSubmissionCrmSyncStatus = NonNullable<FormSubmission['crmSyncStatus']>

export const skipEngageBaySyncContextKey = 'skipEngageBaySync' as const

export function isEngageBaySyncSkipped(req: PayloadRequest): boolean {
  return Boolean((req.context as Record<string, unknown>)?.[skipEngageBaySyncContextKey])
}

/** Persists CRM sync outcome; avoids re-entering EngageBay hook via context flag. */
export async function patchFormSubmissionCrmMetadata(
  payload: Payload,
  req: PayloadRequest,
  id: number | string,
  data: {
    crmSyncStatus: FormSubmissionCrmSyncStatus
    crmSyncedAt: string
    crmSyncDetail?: string | null
  },
): Promise<void> {
  const ctx = req.context as Record<string, unknown>
  ctx[skipEngageBaySyncContextKey] = true
  try {
    await payload.update({
      collection: 'form-submissions',
      id,
      data: {
        crmSyncStatus: data.crmSyncStatus,
        crmSyncedAt: data.crmSyncedAt,
        crmSyncDetail: data.crmSyncDetail ?? null,
      },
      req,
      overrideAccess: true,
    })
  } finally {
    delete ctx[skipEngageBaySyncContextKey]
  }
}
