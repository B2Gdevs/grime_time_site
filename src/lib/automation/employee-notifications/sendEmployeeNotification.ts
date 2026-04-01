import type { Payload } from 'payload'

import { EMPLOYEE_NOTIFICATION_TYPES, type EmployeeNotificationType } from '@/lib/automation/employee-notifications/constants'
import { DEFAULT_STAFF_EMAILS } from '@/lib/brand/emailDefaults'
import { numericRelationId } from '@/lib/crm/internal/relationship'
import { buildEmployeeLeadNotificationEmail } from '@/lib/email/employeeNotifications'
import { getServerSideURL } from '@/utilities/getURL'
import type { Lead } from '@/payload-types'

export type EmployeeNotificationInput = {
  leadId?: number | string
  type: EmployeeNotificationType
}

type DeliveryStatus =
  | 'failed'
  | 'sent'
  | 'skipped_missing_email_adapter'
  | 'skipped_no_recipients'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function dedupeEmails(emails: Array<null | string | undefined>) {
  const seen = new Set<string>()
  const out: string[] = []

  for (const email of emails) {
    if (!email?.trim()) continue
    const normalized = normalizeEmail(email)
    if (seen.has(normalized)) continue
    seen.add(normalized)
    out.push(normalized)
  }

  return out
}

function parseEmployeeNotificationEmails() {
  const raw = process.env.EMPLOYEE_NOTIFICATION_EMAILS?.trim()
  if (!raw) return []

  return dedupeEmails(raw.split(','))
}

async function loadLead(payload: Payload, id: number | string) {
  return (await payload.findByID({
    collection: 'leads',
    depth: 1,
    id,
    overrideAccess: true,
  })) as Lead
}

async function resolveAdminFallbackRecipients(payload: Payload) {
  const fromEnv = parseEmployeeNotificationEmails()
  if (fromEnv.length > 0) return fromEnv

  const users = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    pagination: false,
    sort: 'createdAt',
  })

  const admins = users.docs
    .filter((user) => Array.isArray(user.roles) && user.roles.includes('admin'))
    .map((user) => user.email)

  return dedupeEmails(admins.length > 0 ? admins : [...DEFAULT_STAFF_EMAILS])
}

async function resolveRecipients(payload: Payload, lead: Lead, type: EmployeeNotificationType) {
  const ownerEmail =
    typeof lead.owner === 'object' && lead.owner?.email ? normalizeEmail(lead.owner.email) : null
  const configured = parseEmployeeNotificationEmails()

  if (type === 'lead_owner_reassigned') {
    return dedupeEmails([ownerEmail, ...configured])
  }

  if (ownerEmail) {
    return dedupeEmails([ownerEmail, ...configured])
  }

  return resolveAdminFallbackRecipients(payload)
}

function buildWorkspaceUrl(lead: Lead) {
  const base = getServerSideURL()
  const search = encodeURIComponent(
    lead.customerEmail?.trim() || lead.customerPhone?.trim() || lead.customerName?.trim() || lead.title,
  )
  return `${base}/ops/workspace?owner=all&q=${search}`
}

async function logNotificationActivity(args: {
  detail: string
  lead: Lead
  payload: Payload
  status: DeliveryStatus
  title: string
}) {
  const leadId =
    typeof args.lead.id === 'number' ? args.lead.id : Number.isFinite(Number(args.lead.id)) ? Number(args.lead.id) : null

  await args.payload.create({
    collection: 'crm-activities',
    data: {
      account: numericRelationId(args.lead.account) ?? undefined,
      activityType: args.status === 'failed' ? 'system' : 'email',
      body: args.detail,
      contact: numericRelationId(args.lead.contact) ?? undefined,
      direction: 'internal',
      lead: leadId ?? undefined,
      occurredAt: new Date().toISOString(),
      owner: numericRelationId(args.lead.owner) ?? undefined,
      title: args.title,
    },
    overrideAccess: true,
  })
}

function activityTitle(type: EmployeeNotificationType, status: DeliveryStatus, lead: Lead) {
  const base =
    type === 'lead_owner_reassigned'
      ? `Employee owner handoff: ${lead.title}`
      : `Employee lead alert: ${lead.title}`

  switch (status) {
    case 'sent':
      return `${base} sent`
    case 'failed':
      return `${base} failed`
    case 'skipped_missing_email_adapter':
      return `${base} skipped (email disabled)`
    case 'skipped_no_recipients':
      return `${base} skipped (no recipients)`
  }
}

export async function sendEmployeeNotification(payload: Payload, input: EmployeeNotificationInput) {
  if (!input.leadId) return
  if (!EMPLOYEE_NOTIFICATION_TYPES.includes(input.type)) return

  const lead = await loadLead(payload, input.leadId)
  const recipients = await resolveRecipients(payload, lead, input.type)

  if (recipients.length === 0) {
    await logNotificationActivity({
      detail: 'Employee notification skipped because no recipients were resolved for this lead.',
      lead,
      payload,
      status: 'skipped_no_recipients',
      title: activityTitle(input.type, 'skipped_no_recipients', lead),
    })
    return
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    await logNotificationActivity({
      detail: `Employee notification skipped because RESEND_API_KEY is not configured. Intended recipients: ${recipients.join(', ')}.`,
      lead,
      payload,
      status: 'skipped_missing_email_adapter',
      title: activityTitle(input.type, 'skipped_missing_email_adapter', lead),
    })
    return
  }

  const message = buildEmployeeLeadNotificationEmail({
    customerEmail: lead.customerEmail,
    customerName: lead.customerName,
    customerPhone: lead.customerPhone,
    kind: input.type,
    nextActionAt: lead.nextActionAt,
    notes: lead.notes,
    priority: lead.priority,
    serviceAddress: lead.serviceAddress?.street1,
    serviceSummary: lead.serviceSummary,
    source: lead.source,
    title: lead.title,
    workspaceUrl: buildWorkspaceUrl(lead),
  })

  try {
    await payload.sendEmail({
      html: message.html,
      subject: message.subject,
      text: message.text,
      to: recipients,
    })

    await logNotificationActivity({
      detail: `Employee notification sent to ${recipients.join(', ')}.`,
      lead,
      payload,
      status: 'sent',
      title: activityTitle(input.type, 'sent', lead),
    })
  } catch (error) {
    await logNotificationActivity({
      detail: `Employee notification failed for ${recipients.join(', ')}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      lead,
      payload,
      status: 'failed',
      title: activityTitle(input.type, 'failed', lead),
    })

    throw error
  }
}
