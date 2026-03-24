import { getLeadEmailFromRows, getLeadNameFromRows, getLeadPhoneFromRows, submissionRowsToPlaintext } from '@/lib/crm/submissionRows'

import type { CrmProvider, CrmSyncResult, SubmissionRow } from '@/lib/crm/types'

const HUBSPOT_BASE_URL = 'https://api.hubapi.com'

type HubSpotSearchResponse = {
  results?: Array<{ id: string }>
}

function getHubSpotAccessToken(): string | null {
  return (
    process.env.HUBSPOT_ACCESS_TOKEN?.trim() ||
    process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim() ||
    null
  )
}

function hubSpotHeaders() {
  const accessToken = getHubSpotAccessToken()

  if (!accessToken) {
    throw new Error('Missing HUBSPOT_ACCESS_TOKEN')
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

export function hubSpotConfigured(): boolean {
  return Boolean(getHubSpotAccessToken())
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

async function upsertHubSpotContact(rows: SubmissionRow[]): Promise<{ contactId: string; noteWarning?: string }> {
  const email = getLeadEmailFromRows(rows)

  if (!email) {
    throw new Error('Lead email required for HubSpot sync.')
  }

  const name = getLeadNameFromRows(rows)
  const phone = getLeadPhoneFromRows(rows)
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

  if (process.env.HUBSPOT_ATTACH_SUBMISSION_NOTE === 'false') {
    return { contactId, noteWarning: 'HUBSPOT_ATTACH_SUBMISSION_NOTE=false' }
  }

  const noteResponse = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes`, {
    body: JSON.stringify({
      associations: [
        {
          to: {
            id: contactId,
          },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 202,
            },
          ],
        },
      ],
      properties: {
        hs_note_body: submissionRowsToPlaintext(rows),
        hs_timestamp: new Date().toISOString(),
      },
    }),
    headers: hubSpotHeaders(),
    method: 'POST',
  })

  if (!noteResponse.ok) {
    const detail = await noteResponse.text().catch(() => '')
    return {
      contactId,
      noteWarning: `HubSpot note warning (${noteResponse.status}): ${detail.slice(0, 250)}`,
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
    const result = await upsertHubSpotContact(rows)

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

export const hubSpotProvider: CrmProvider = {
  isConfigured: hubSpotConfigured,
  label: 'HubSpot',
  slug: 'hubspot',
  syncFormSubmission: async ({ rows }) => syncFormSubmissionToHubSpot(rows),
}
