import type { CollectionBeforeChangeHook } from 'payload'

import { syncQuoteDealToActiveCrm } from '@/lib/crm'
import type { QuoteDealSyncInput } from '@/lib/crm/types'

type QuoteCrmGroup = {
  dealId?: null | string
  provider?: null | string
}

function nowIso(): string {
  return new Date().toISOString()
}

function mergeQuoteData(data: Record<string, unknown>, originalDoc: Record<string, unknown> | null): QuoteDealSyncInput {
  const originalPricing = (originalDoc?.pricing as Record<string, unknown> | undefined) ?? {}
  const nextPricing = (data.pricing as Record<string, unknown> | undefined) ?? {}
  const originalAddress = (originalDoc?.serviceAddress as Record<string, unknown> | undefined) ?? {}
  const nextAddress = (data.serviceAddress as Record<string, unknown> | undefined) ?? {}

  return {
    ...(originalDoc ?? {}),
    ...data,
    pricing: {
      ...originalPricing,
      ...nextPricing,
    },
    serviceAddress: {
      ...originalAddress,
      ...nextAddress,
    },
  } as QuoteDealSyncInput
}

function isSyncableQuoteStatus(status: unknown): boolean {
  return status === 'sent' || status === 'accepted' || status === 'lost'
}

function nextCrmGroup(args: {
  data: Record<string, unknown>
  detail: string | null
  existingCrm: QuoteCrmGroup
  provider: null | string
  status: string
}) {
  const currentCrm = (args.data.crm as QuoteCrmGroup | undefined) ?? {}

  return {
    ...currentCrm,
    dealId: currentCrm.dealId ?? args.existingCrm.dealId ?? null,
    provider: args.provider ?? currentCrm.provider ?? args.existingCrm.provider ?? null,
    syncDetail: args.detail,
    syncStatus: args.status,
    syncedAt: nowIso(),
  }
}

export const beforeQuoteCrm: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data || (operation !== 'create' && operation !== 'update')) return data

  const currentData = data as Record<string, unknown>
  const existingDoc = (originalDoc as Record<string, unknown> | undefined) ?? null
  const existingCrm = ((existingDoc?.crm as QuoteCrmGroup | undefined) ?? {}) as QuoteCrmGroup
  const mergedQuote = mergeQuoteData(currentData, existingDoc)

  if (!isSyncableQuoteStatus(mergedQuote.status)) {
    return {
      ...currentData,
      crm: nextCrmGroup({
        data: currentData,
        detail: 'Quote remains internal until it reaches sent, accepted, or lost.',
        existingCrm,
        provider: existingCrm.provider ?? null,
        status: 'skipped_draft',
      }),
    }
  }

  if (!mergedQuote.customerEmail?.trim()) {
    return {
      ...currentData,
      crm: nextCrmGroup({
        data: currentData,
        detail: 'Customer email is required before the quote can move into the internal follow-up pipeline.',
        existingCrm,
        provider: existingCrm.provider ?? null,
        status: 'skipped_no_email',
      }),
    }
  }

  try {
    const result = await syncQuoteDealToActiveCrm({
      existingDealId: existingCrm.dealId ?? null,
      operation,
      previousStatus: typeof existingDoc?.status === 'string' ? existingDoc.status : null,
      quote: mergedQuote,
    })

    return {
      ...currentData,
      crm: {
        ...nextCrmGroup({
          data: currentData,
          detail: result.detail,
          existingCrm,
          provider: result.status === 'skipped_provider' ? existingCrm.provider ?? null : result.provider,
          status: result.status,
        }),
        dealId: result.externalDealId ?? existingCrm.dealId ?? null,
      },
    }
  } catch (error) {
    req.payload.logger.error({ err: error }, 'Quote follow-up pipeline sync error')

    return {
      ...currentData,
      crm: nextCrmGroup({
        data: currentData,
        detail: error instanceof Error ? error.message.slice(0, 400) : 'unknown error',
        existingCrm,
        provider: existingCrm.provider ?? null,
        status: 'failed',
      }),
    }
  }
}
