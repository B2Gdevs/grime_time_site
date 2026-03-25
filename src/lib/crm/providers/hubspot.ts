import { getLeadEmailFromRows, getLeadNameFromRows, getLeadPhoneFromRows, submissionRowsToPlaintext } from '@/lib/crm/submissionRows'
import { getHubSpotAccessToken } from '@/lib/hubspot/accessToken'

import type {
  CrmProvider,
  CrmSyncResult,
  QuoteDealSyncInput,
  QuoteSyncResult,
  SubmissionRow,
  SyncQuoteArgs,
} from '@/lib/crm/types'

const HUBSPOT_BASE_URL = 'https://api.hubapi.com'
const HUBSPOT_DEAL_TO_CONTACT_ASSOCIATION_TYPE_ID = 3
const HUBSPOT_NOTE_TO_CONTACT_ASSOCIATION_TYPE_ID = 202
const HUBSPOT_NOTE_TO_DEAL_ASSOCIATION_TYPE_ID = 214

type HubSpotSearchResponse = {
  results?: Array<{ id: string }>
}

type HubSpotIdResponse = {
  id?: string
}

function hubSpotHeaders() {
  const accessToken = getHubSpotAccessToken()

  if (!accessToken) {
    throw new Error('Missing HUBSPOT_ACCESS_TOKEN or HUBSPOT_PRIVATE_APP_TOKEN')
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

export function hubSpotConfigured(): boolean {
  return Boolean(getHubSpotAccessToken())
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value?.trim() ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function hubSpotQuotePipelineId(): string {
  return process.env.HUBSPOT_QUOTE_DEAL_PIPELINE_ID?.trim() || 'default'
}

function hubSpotQuoteStageId(status: string | null | undefined): string | null {
  const sent = process.env.HUBSPOT_QUOTE_DEAL_STAGE_SENT?.trim() || null
  const accepted = process.env.HUBSPOT_QUOTE_DEAL_STAGE_ACCEPTED?.trim() || sent
  const lost = process.env.HUBSPOT_QUOTE_DEAL_STAGE_LOST?.trim() || sent

  if (status === 'accepted') return accepted
  if (status === 'lost') return lost
  return sent
}

function hubSpotQuoteOwnerId(): string | null {
  return process.env.HUBSPOT_QUOTE_OWNER_ID?.trim() || null
}

function hubSpotQuoteNoteEnabled(): boolean {
  return process.env.HUBSPOT_ATTACH_QUOTE_NOTE !== 'false'
}

function quoteCloseDateIso(value: QuoteDealSyncInput): string {
  if (value.validUntil) {
    const parsed = new Date(value.validUntil)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }

  const fallback = new Date()
  fallback.setDate(fallback.getDate() + parsePositiveInteger(process.env.HUBSPOT_QUOTE_CLOSE_DAYS, 14))
  return fallback.toISOString()
}

function formatMoney(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(value)
}

function compactLines(lines: Array<string | null | undefined>): string[] {
  return lines.map((line) => line?.trim()).filter(Boolean) as string[]
}

function quoteAddressText(quote: QuoteDealSyncInput): string | null {
  const address = quote.serviceAddress
  if (!address) return null

  const line1 = compactLines([address.street1, address.street2]).join(', ')
  const line2 = compactLines([address.city, address.state, address.postalCode]).join(', ')
  const output = compactLines([line1, line2]).join('\n')
  return output || null
}

function quoteServiceLineText(quote: QuoteDealSyncInput): string {
  const lines = quote.serviceLines ?? []
  if (lines.length === 0) {
    return quote.surfaceDescription?.trim() || 'No service lines recorded.'
  }

  return lines
    .map((line) => {
      const description = line.description?.trim() || line.serviceType?.trim() || 'Line item'
      const quantity =
        typeof line.quantity === 'number' && Number.isFinite(line.quantity) ? `${line.quantity}` : null
      const unit = line.unit?.trim() || null
      const unitPrice = formatMoney(line.unitPrice ?? null)
      const lineTotal = formatMoney(line.lineTotal ?? null)
      const metrics = compactLines([
        quantity ? `${quantity}${unit ? ` ${unit}` : ''}` : null,
        unitPrice ? `@ ${unitPrice}` : null,
        lineTotal ? `= ${lineTotal}` : null,
      ]).join(' ')

      return metrics ? `${description} (${metrics})` : description
    })
    .join('; ')
}

function quoteDealDescription(quote: QuoteDealSyncInput): string {
  return compactLines([
    quote.surfaceDescription || null,
    quote.accessNotes ? `Access: ${quote.accessNotes}` : null,
    quoteAddressText(quote) ? `Service address: ${quoteAddressText(quote)}` : null,
    `Services: ${quoteServiceLineText(quote)}`,
  ]).join('\n')
}

function quoteNoteBody(quote: QuoteDealSyncInput): string {
  return compactLines([
    `Quote: ${quote.title?.trim() || 'Untitled quote'}`,
    quote.status ? `Status: ${quote.status}` : null,
    quote.customerName ? `Customer: ${quote.customerName}` : null,
    quote.customerEmail ? `Email: ${quote.customerEmail}` : null,
    quote.customerPhone ? `Phone: ${quote.customerPhone}` : null,
    quote.propertyType ? `Property type: ${quote.propertyType}` : null,
    quote.jobSize ? `Job size: ${quote.jobSize}` : null,
    quoteAddressText(quote) ? `Service address:\n${quoteAddressText(quote)}` : null,
    `Services: ${quoteServiceLineText(quote)}`,
    quote.pricing?.subtotal != null ? `Subtotal: ${formatMoney(quote.pricing.subtotal)}` : null,
    quote.pricing?.salesTaxAmount != null ? `Sales tax: ${formatMoney(quote.pricing.salesTaxAmount)}` : null,
    quote.pricing?.total != null ? `Total: ${formatMoney(quote.pricing.total)}` : null,
    quote.pricing?.taxDecision ? `Tax decision: ${quote.pricing.taxDecision}` : null,
    quote.pricing?.taxDecisionNotes ? `Tax notes: ${quote.pricing.taxDecisionNotes}` : null,
    quote.accessNotes ? `Access notes: ${quote.accessNotes}` : null,
    quote.internalNotes ? `Internal notes: ${quote.internalNotes}` : null,
  ]).join('\n\n')
}

async function createHubSpotNote(args: {
  contactId: string
  dealId?: string | null
  noteBody: string
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes`, {
    body: JSON.stringify({
      associations: [
        {
          to: { id: args.contactId },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: HUBSPOT_NOTE_TO_CONTACT_ASSOCIATION_TYPE_ID,
            },
          ],
        },
        ...(args.dealId
          ? [
              {
                to: { id: args.dealId },
                types: [
                  {
                    associationCategory: 'HUBSPOT_DEFINED',
                    associationTypeId: HUBSPOT_NOTE_TO_DEAL_ASSOCIATION_TYPE_ID,
                  },
                ],
              },
            ]
          : []),
      ],
      properties: {
        hs_note_body: args.noteBody,
        hs_timestamp: new Date().toISOString(),
      },
    }),
    headers: hubSpotHeaders(),
    method: 'POST',
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    return {
      ok: false,
      reason: `HubSpot note warning (${response.status}): ${detail.slice(0, 250)}`,
    }
  }

  return { ok: true }
}

async function searchHubSpotContactId(email: string): Promise<string | null> {
  const response = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/search`, {
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              operator: 'EQ',
              propertyName: 'email',
              value: email,
            },
          ],
        },
      ],
      limit: 1,
      properties: ['email'],
    }),
    headers: hubSpotHeaders(),
    method: 'POST',
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`HubSpot contact search failed (${response.status}): ${detail.slice(0, 250)}`)
  }

  const body = (await response.json().catch(() => ({}))) as HubSpotSearchResponse
  return body.results?.[0]?.id ?? null
}

async function upsertHubSpotContact(args: {
  email: string
  name?: string | null
  noteBody?: string | null
  phone?: string | null
}): Promise<{ contactId: string; noteWarning?: string }> {
  const email = args.email?.trim()

  if (!email) {
    throw new Error('Lead email required for HubSpot sync.')
  }

  const name = args.name?.trim() || null
  const phone = args.phone?.trim() || null
  const [firstname, ...lastParts] = (name || '').split(' ').filter(Boolean)
  const lastname = lastParts.join(' ') || undefined
  const properties = {
    email,
    ...(firstname ? { firstname } : {}),
    ...(lastname ? { lastname } : {}),
    ...(phone ? { phone } : {}),
  }

  const existingId = await searchHubSpotContactId(email)
  const method = existingId ? 'PATCH' : 'POST'
  const endpoint = existingId
    ? `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${existingId}`
    : `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts`

  const response = await fetch(endpoint, {
    body: JSON.stringify({ properties }),
    headers: hubSpotHeaders(),
    method,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`HubSpot contact sync failed (${response.status}): ${detail.slice(0, 250)}`)
  }

  const body = (await response.json().catch(() => ({}))) as { id?: string }
  const contactId = existingId || body.id

  if (!contactId) {
    throw new Error('HubSpot did not return a contact id.')
  }

  if (!args.noteBody?.trim()) {
    return { contactId }
  }

  if (process.env.HUBSPOT_ATTACH_SUBMISSION_NOTE === 'false') {
    return { contactId, noteWarning: 'HUBSPOT_ATTACH_SUBMISSION_NOTE=false' }
  }

  const noteResult = await createHubSpotNote({
    contactId,
    noteBody: args.noteBody,
  })

  if (!noteResult.ok) {
    return {
      contactId,
      noteWarning: noteResult.reason,
    }
  }

  return { contactId }
}

async function syncFormSubmissionToHubSpot(rows: SubmissionRow[]): Promise<CrmSyncResult> {
  const email = getLeadEmailFromRows(rows)

  if (!email) {
    return {
      detail: null,
      status: 'skipped_no_email',
    }
  }

  try {
    const result = await upsertHubSpotContact({
      email,
      name: getLeadNameFromRows(rows),
      noteBody: submissionRowsToPlaintext(rows),
      phone: getLeadPhoneFromRows(rows),
    })

    if (result.noteWarning) {
      return {
        detail: `Contact synced to HubSpot; note issue: ${result.noteWarning}`,
        status: 'ok_note_warning',
      }
    }

    return {
      detail: 'Contact synced to HubSpot.',
      status: 'ok',
    }
  } catch (error) {
    return {
      detail: error instanceof Error ? error.message.slice(0, 400) : 'unknown error',
      status: 'failed_contact',
    }
  }
}

async function upsertHubSpotDeal(args: {
  contactId: string
  existingDealId?: null | string
  operation: SyncQuoteArgs['operation']
  previousStatus?: null | string
  quote: QuoteDealSyncInput
}): Promise<{ dealId: string; noteWarning?: string }> {
  const stageId = hubSpotQuoteStageId(args.quote.status)
  if (!stageId) {
    throw new Error('Missing HUBSPOT_QUOTE_DEAL_STAGE_SENT for HubSpot quote sync.')
  }

  const properties = {
    amount:
      typeof args.quote.pricing?.total === 'number' && Number.isFinite(args.quote.pricing.total)
        ? String(args.quote.pricing.total)
        : undefined,
    closedate: quoteCloseDateIso(args.quote),
    dealname: args.quote.title?.trim() || args.quote.customerEmail?.trim() || 'Website quote',
    dealstage: stageId,
    description: quoteDealDescription(args.quote),
    hubspot_owner_id: hubSpotQuoteOwnerId() ?? undefined,
    pipeline: hubSpotQuotePipelineId(),
  }

  const dealId = args.existingDealId?.trim() || null
  const endpoint = dealId
    ? `${HUBSPOT_BASE_URL}/crm/v3/objects/deals/${dealId}`
    : `${HUBSPOT_BASE_URL}/crm/v3/objects/deals`
  const method = dealId ? 'PATCH' : 'POST'

  const response = await fetch(endpoint, {
    body: JSON.stringify({
      ...(dealId
        ? {}
        : {
            associations: [
              {
                to: { id: args.contactId },
                types: [
                  {
                    associationCategory: 'HUBSPOT_DEFINED',
                    associationTypeId: HUBSPOT_DEAL_TO_CONTACT_ASSOCIATION_TYPE_ID,
                  },
                ],
              },
            ],
          }),
      properties,
    }),
    headers: hubSpotHeaders(),
    method,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`HubSpot deal sync failed (${response.status}): ${detail.slice(0, 250)}`)
  }

  const body = (await response.json().catch(() => ({}))) as HubSpotIdResponse
  const nextDealId = dealId || body.id
  if (!nextDealId) {
    throw new Error('HubSpot did not return a deal id.')
  }

  const shouldAttachNote =
    hubSpotQuoteNoteEnabled() &&
    (!dealId || (args.previousStatus ?? null) !== (args.quote.status ?? null) || args.operation === 'create')

  if (!shouldAttachNote) {
    return { dealId: nextDealId }
  }

  const noteResult = await createHubSpotNote({
    contactId: args.contactId,
    dealId: nextDealId,
    noteBody: quoteNoteBody(args.quote),
  })

  if (!noteResult.ok) {
    return {
      dealId: nextDealId,
      noteWarning: noteResult.reason,
    }
  }

  return { dealId: nextDealId }
}

async function syncQuoteDealToHubSpot(args: SyncQuoteArgs): Promise<QuoteSyncResult> {
  const email = args.quote.customerEmail?.trim()

  if (!email) {
    return {
      detail: 'Customer email is required for HubSpot quote sync.',
      provider: 'hubspot',
      status: 'skipped_no_email',
    }
  }

  try {
    const contact = await upsertHubSpotContact({
      email,
      name: args.quote.customerName,
      phone: args.quote.customerPhone,
    })
    const deal = await upsertHubSpotDeal({
      contactId: contact.contactId,
      existingDealId: args.existingDealId ?? null,
      operation: args.operation,
      previousStatus: args.previousStatus ?? null,
      quote: args.quote,
    })

    if (deal.noteWarning) {
      return {
        detail: `Quote synced to HubSpot deal ${deal.dealId}; note issue: ${deal.noteWarning}`,
        externalDealId: deal.dealId,
        provider: 'hubspot',
        status: 'ok_note_warning',
      }
    }

    return {
      detail: `Quote synced to HubSpot deal ${deal.dealId}.`,
      externalDealId: deal.dealId,
      provider: 'hubspot',
      status: 'ok',
    }
  } catch (error) {
    return {
      detail: error instanceof Error ? error.message.slice(0, 400) : 'unknown error',
      provider: 'hubspot',
      status: 'failed',
    }
  }
}

export const hubSpotProvider: CrmProvider = {
  isConfigured: hubSpotConfigured,
  label: 'HubSpot',
  slug: 'hubspot',
  syncFormSubmission: async ({ rows }) => syncFormSubmissionToHubSpot(rows),
  syncQuoteDeal: async (args) => syncQuoteDealToHubSpot(args),
}
