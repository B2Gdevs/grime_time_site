import type { FormSubmission } from '@/payload-types'

export type CrmProviderSlug = 'engagebay' | 'hubspot'

export type SubmissionRow = {
  field: string
  value: string
}

export type CrmSyncStatus = NonNullable<FormSubmission['crmSyncStatus']>

export type CrmSyncResult = {
  detail: string | null
  status: CrmSyncStatus
}

export type CrmProviderSummary = {
  configured: boolean
  label: string
  slug: CrmProviderSlug
}

export type SyncFormSubmissionArgs = {
  rows: SubmissionRow[]
}

export interface CrmProvider {
  isConfigured: () => boolean
  label: string
  slug: CrmProviderSlug
  syncFormSubmission: (args: SyncFormSubmissionArgs) => Promise<CrmSyncResult>
}
