/**
 * Pushes Payload form-submission rows to EngageBay as a contact.
 * API: POST https://app.engagebay.com/dev/api/panel/subscribers/subscriber
 * Notes: POST .../notes (parentId = contact id)
 * @see https://github.com/engagebay/restapi
 */

const ENGAGEBAY_PANEL_BASE = 'https://app.engagebay.com/dev/api/panel'

export type SubmissionRow = { field: string; value: string }

function pickValue(rows: SubmissionRow[], ...candidates: string[]): string {
  for (const c of candidates) {
    const hit = rows.find((r) => r.field.toLowerCase() === c.toLowerCase())
    const v = hit?.value?.trim()
    if (v) return v
  }
  return ''
}

export type EngageBaySubscriberPayload = {
  properties: Array<{
    name: string
    value: string
    field_type: string
    is_searchable: boolean
    type: 'SYSTEM' | 'CUSTOM'
  }>
  tags?: string[]
}

export function submissionRowsToEngageBayBody(rows: SubmissionRow[]): EngageBaySubscriberPayload | null {
  const email = pickValue(rows, 'email', 'e-mail', 'Email')
  if (!email) return null

  const name = pickValue(rows, 'fullName', 'fullname', 'name', 'firstName', 'first_name')
  const phone = pickValue(rows, 'phone', 'Phone', 'mobile', 'tel')

  const properties: EngageBaySubscriberPayload['properties'] = [
    {
      name: 'email',
      value: email,
      field_type: 'TEXT',
      is_searchable: false,
      type: 'SYSTEM',
    },
  ]

  if (name) {
    properties.push({
      name: 'name',
      value: name,
      field_type: 'TEXT',
      is_searchable: false,
      type: 'SYSTEM',
    })
  }
  if (phone) {
    properties.push({
      name: 'phone',
      value: phone,
      field_type: 'TEXT',
      is_searchable: false,
      type: 'SYSTEM',
    })
  }

  return { properties }
}

export function getLeadEmailFromRows(rows: SubmissionRow[]): string | null {
  const email = pickValue(rows, 'email', 'e-mail', 'Email')
  return email ? email : null
}

export function submissionRowsToNoteContent(rows: SubmissionRow[], maxLen = 8000): string {
  return rows
    .map((r) => `${r.field}: ${r.value}`)
    .join('\n')
    .slice(0, maxLen)
}

function engageBayAuthHeaders(): HeadersInit {
  const apiKey = process.env.ENGAGEBAY_API_KEY?.trim()
  if (!apiKey) throw new Error('ENGAGEBAY_API_KEY is not set')
  return {
    Authorization: apiKey,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

function parseContactIdFromSubscriberResponse(text: string): string | null {
  try {
    const data = JSON.parse(text) as { id?: string | number }
    if (data?.id != null && data.id !== '') return String(data.id)
  } catch {
    /* non-JSON success body */
  }
  return null
}

export async function fetchEngageBayContactIdByEmail(email: string): Promise<string | null> {
  const url = `${ENGAGEBAY_PANEL_BASE}/subscribers/contact-by-email/${encodeURIComponent(email)}`
  const res = await fetch(url, { headers: engageBayAuthHeaders() })
  if (!res.ok) return null
  try {
    const data = (await res.json()) as Array<{ id?: string | number }>
    if (Array.isArray(data) && data[0]?.id != null) return String(data[0].id)
  } catch {
    return null
  }
  return null
}

export async function postEngageBayContactNote(
  parentId: string,
  subject: string,
  content: string,
): Promise<Response> {
  return fetch(`${ENGAGEBAY_PANEL_BASE}/notes`, {
    method: 'POST',
    headers: engageBayAuthHeaders(),
    body: JSON.stringify({ subject, content, parentId }),
  })
}

/**
 * After a successful subscriber POST, attach full field dump as a CRM note (optional).
 * Resolves contact id from response JSON or GET-by-email.
 */
export async function attachFormSubmissionNoteToEngageBay(args: {
  subscriberResponseBodyText: string
  leadEmail: string
  rows: SubmissionRow[]
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const flag = process.env.ENGAGEBAY_ATTACH_SUBMISSION_NOTE?.trim().toLowerCase()
  if (flag === 'false' || flag === '0') return { ok: true }

  let parentId = parseContactIdFromSubscriberResponse(args.subscriberResponseBodyText)
  if (!parentId) {
    parentId = await fetchEngageBayContactIdByEmail(args.leadEmail)
  }
  if (!parentId) return { ok: false, reason: 'no_contact_id' }

  const content = submissionRowsToNoteContent(args.rows)
  if (!content.trim()) return { ok: true }

  const noteRes = await postEngageBayContactNote(
    parentId,
    'Website form submission',
    content,
  )
  if (!noteRes.ok) {
    const t = await noteRes.text().catch(() => '')
    return { ok: false, reason: `note_${noteRes.status}:${t.slice(0, 200)}` }
  }
  return { ok: true }
}

export async function postSubscriberToEngageBay(body: EngageBaySubscriberPayload): Promise<Response> {
  const tags = process.env.ENGAGEBAY_SUBMISSION_TAG?.trim()
  const payload = tags ? { ...body, tags: [tags] } : body

  return fetch(`${ENGAGEBAY_PANEL_BASE}/subscribers/subscriber`, {
    method: 'POST',
    headers: engageBayAuthHeaders(),
    body: JSON.stringify(payload),
  })
}
