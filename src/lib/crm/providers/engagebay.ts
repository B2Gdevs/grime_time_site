import { getLeadEmailFromRows, getLeadNameFromRows, getLeadPhoneFromRows, submissionRowsToPlaintext } from '@/lib/crm/submissionRows'

import type { CrmProvider, CrmSyncResult, SubmissionRow } from '@/lib/crm/types'

const ENGAGEBAY_BASE_URL = 'https://app.engagebay.com/dev/api/panel'

type EngageBaySubscriberBody = {
  email: string
  name?: string
  phone?: string
  tags?: string[]
}

function getEngageBayApiKey(): string | null {
  return process.env.ENGAGEBAY_API_KEY?.trim() || null
}

function engageBayHeaders() {
  const apiKey = getEngageBayApiKey()

  if (!apiKey) {
    throw new Error('Missing ENGAGEBAY_API_KEY')
  }

  return {
    Authorization: apiKey,
    'Content-Type': 'application/json',
  }
}

function submissionRowsToEngageBayBody(rows: SubmissionRow[]): EngageBaySubscriberBody | null {
  const email = getLeadEmailFromRows(rows)

  if (!email) return null

  const name = getLeadNameFromRows(rows)
  const phone = getLeadPhoneFromRows(rows)
  const tag = process.env.ENGAGEBAY_SUBMISSION_TAG?.trim()

  return {
    email,
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
    ...(tag ? { tags: [tag] } : {}),
  }
}

async function postSubscriberToEngageBay(body: EngageBaySubscriberBody): Promise<Response> {
  return fetch(`${ENGAGEBAY_BASE_URL}/subscribers/subscriber`, {
    body: JSON.stringify(body),
    headers: engageBayHeaders(),
    method: 'POST',
  })
}

async function attachFormSubmissionNoteToEngageBay(args: {
  leadEmail: string
  rows: SubmissionRow[]
  subscriberResponseBodyText: string
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (process.env.ENGAGEBAY_ATTACH_SUBMISSION_NOTE === 'false') {
    return { ok: false, reason: 'ENGAGEBAY_ATTACH_SUBMISSION_NOTE=false' }
  }

  const noteBody = submissionRowsToPlaintext(args.rows)

  if (!noteBody) {
    return { ok: false, reason: 'No submission rows available for CRM note.' }
  }

  try {
    const noteResponse = await fetch(`${ENGAGEBAY_BASE_URL}/notes`, {
      body: JSON.stringify({
        body: noteBody,
        contacts: [{ email: args.leadEmail }],
        title: 'Website form submission',
      }),
      headers: engageBayHeaders(),
      method: 'POST',
    })

    if (!noteResponse.ok) {
      const responseText = await noteResponse.text().catch(() => '')
      return {
        ok: false,
        reason: `HTTP ${noteResponse.status}: ${responseText.slice(0, 300)}`,
      }
    }

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Unknown note error',
    }
  }
}

export function engageBayConfigured(): boolean {
  if (process.env.ENGAGEBAY_SYNC_FORM_SUBMISSIONS === 'false') return false
  return Boolean(getEngageBayApiKey())
}

async function syncFormSubmissionToEngageBay(rows: SubmissionRow[]): Promise<CrmSyncResult> {
  const body = submissionRowsToEngageBayBody(rows)
  const leadEmail = getLeadEmailFromRows(rows)

  if (!body || !leadEmail) {
    return {
      detail: null,
      status: 'skipped_no_email',
    }
  }

  try {
    const response = await postSubscriberToEngageBay(body)
    const responseText = await response.text().catch(() => '')

    if (!response.ok) {
      return {
        detail: `HTTP ${response.status}: ${responseText.slice(0, 400)}`,
        status: 'failed_contact',
      }
    }

    const noteResult = await attachFormSubmissionNoteToEngageBay({
      leadEmail,
      rows,
      subscriberResponseBodyText: responseText,
    })

    if (!noteResult.ok) {
      return {
        detail: `Contact synced; note issue: ${noteResult.reason}`,
        status: 'ok_note_warning',
      }
    }

    return {
      detail: 'Contact synced to EngageBay.',
      status: 'ok',
    }
  } catch (error) {
    return {
      detail: error instanceof Error ? error.message.slice(0, 400) : 'unknown error',
      status: 'failed',
    }
  }
}

export const engageBayProvider: CrmProvider = {
  isConfigured: engageBayConfigured,
  label: 'EngageBay',
  slug: 'engagebay',
  syncFormSubmission: async ({ rows }) => syncFormSubmissionToEngageBay(rows),
}
