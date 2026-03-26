import type {
  CrmProvider,
  CrmProviderSlug,
  CrmProviderSummary,
  CrmSyncResult,
  QuoteSyncResult,
  SubmissionRow,
  SyncQuoteArgs,
} from './types'
import { syncInternalFormSubmission } from './internal/formSync'
import { syncInternalQuote } from './internal/quoteSync'

const FORM_SYNC_DISABLED_DETAIL =
  'Lead saved in Payload. External CRM sync is disabled while the first-party CRM is being built.'

const QUOTE_SYNC_DISABLED_DETAIL =
  'Quote remains in Payload. External deal sync is disabled while the first-party CRM pipeline is being built.'

export function getCrmProviderSummaries(): CrmProviderSummary[] {
  return []
}

export function getConfiguredCrmProviders(): CrmProvider[] {
  return []
}

export async function getActiveCrmProvider(): Promise<CrmProvider | null> {
  return null
}

export async function getCrmRuntimeState(): Promise<{
  activeProvider: CrmProviderSlug | null
  availableProviders: CrmProviderSummary[]
}> {
  return {
    activeProvider: null,
    availableProviders: [],
  }
}

export async function setActiveCrmProvider(_slug: CrmProviderSlug): Promise<{
  activeProvider: CrmProviderSlug
  availableProviders: CrmProviderSummary[]
}> {
  throw new Error('External CRM providers are disabled. Payload is the active CRM system of record.')
}

export async function syncFormSubmissionToActiveCrm(args: {
  req: SyncQuoteArgs['req']
  rows: SubmissionRow[]
}): Promise<CrmSyncResult> {
  return syncInternalFormSubmission(args.req, args.rows)
}

export async function syncQuoteDealToActiveCrm(args: SyncQuoteArgs): Promise<QuoteSyncResult> {
  if (!args.quote.status || args.quote.status === 'draft') {
    return {
      detail: QUOTE_SYNC_DISABLED_DETAIL,
      provider: null,
      status: 'skipped_provider',
    }
  }

  return syncInternalQuote(args.req, args)
}
