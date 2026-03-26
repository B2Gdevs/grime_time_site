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

export const QUOTE_CRM_SYNC_STATUS_OPTIONS = [
  { label: 'Skipped: draft or unsent', value: 'skipped_draft' },
  { label: 'Skipped: no customer email', value: 'skipped_no_email' },
  { label: 'Skipped: provider unavailable', value: 'skipped_provider' },
  { label: 'Synced', value: 'ok' },
  { label: 'Synced with warning', value: 'ok_note_warning' },
  { label: 'Failed', value: 'failed' },
] as const

export type QuoteCrmSyncStatus = (typeof QUOTE_CRM_SYNC_STATUS_OPTIONS)[number]['value']

export type QuoteDealSyncInput = {
  accessNotes?: string | null
  customerEmail?: string | null
  customerName?: string | null
  customerPhone?: string | null
  customerUser?: number | string | { id?: null | number | string } | null
  id?: number | string
  internalNotes?: string | null
  jobSize?: string | null
  pricing?: {
    salesTaxAmount?: number | null
    subtotal?: number | null
    taxDecision?: string | null
    taxDecisionNotes?: string | null
    total?: number | null
  } | null
  propertyType?: string | null
  serviceAddress?: {
    city?: string | null
    postalCode?: string | null
    state?: string | null
    street1?: string | null
    street2?: string | null
  } | null
  serviceLines?:
    | Array<{
        description?: string | null
        lineTotal?: number | null
        quantity?: number | null
        serviceType?: string | null
        unit?: string | null
        unitPrice?: number | null
      }>
    | null
  status?: string | null
  surfaceDescription?: string | null
  title?: string | null
  validUntil?: string | null
}

export type QuoteSyncResult = {
  detail: string | null
  externalDealId?: null | string
  provider: CrmProviderSlug | null
  status: QuoteCrmSyncStatus
}

export type CrmProviderSummary = {
  configured: boolean
  label: string
  slug: CrmProviderSlug
}

export type SyncFormSubmissionArgs = {
  req: import('payload').PayloadRequest
  rows: SubmissionRow[]
}

export type SyncQuoteArgs = {
  existingDealId?: null | string
  operation: 'create' | 'update'
  previousStatus?: null | string
  quote: QuoteDealSyncInput
  req: import('payload').PayloadRequest
}

export interface CrmProvider {
  isConfigured: () => boolean
  label: string
  slug: CrmProviderSlug
  syncFormSubmission: (args: SyncFormSubmissionArgs) => Promise<CrmSyncResult>
  syncQuoteDeal?: (args: SyncQuoteArgs) => Promise<QuoteSyncResult>
}
