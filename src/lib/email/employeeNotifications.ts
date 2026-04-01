import { formatDate, sentenceCase } from '@/lib/customers/format'

type EmployeeEmailMessage = {
  html: string
  subject: string
  text: string
}

function escapeHtml(value: null | string | undefined) {
  return (value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function sourceLabel(source: null | string | undefined) {
  switch (source) {
    case 'instant_quote':
      return 'Instant quote request'
    case 'schedule_request':
      return 'Schedule request'
    case 'contact_request':
      return 'Contact request'
    default:
      return 'Lead intake'
  }
}

function ownerIntro(kind: 'lead_created' | 'lead_owner_reassigned') {
  if (kind === 'lead_owner_reassigned') {
    return 'A lead was reassigned to you and needs follow-up.'
  }

  return 'A new inbound request just landed in Grime Time.'
}

export function buildEmployeeLeadNotificationEmail(args: {
  customerEmail?: null | string
  customerName?: null | string
  customerPhone?: null | string
  kind: 'lead_created' | 'lead_owner_reassigned'
  nextActionAt?: null | string
  notes?: null | string
  priority?: null | string
  serviceAddress?: null | string
  serviceSummary?: null | string
  source?: null | string
  title: string
  workspaceUrl: string
}): EmployeeEmailMessage {
  const label = sourceLabel(args.source)
  const subjectPrefix =
    args.kind === 'lead_owner_reassigned' ? 'Lead reassigned' : `New ${label.toLowerCase()}`
  const subject = `${subjectPrefix}: ${args.customerName?.trim() || args.title}`
  const detailLines = [
    `Title: ${args.title}`,
    `Source: ${label}`,
    `Priority: ${sentenceCase(args.priority)}`,
    `Customer: ${args.customerName || 'Not provided'}`,
    `Email: ${args.customerEmail || 'Not provided'}`,
    `Phone: ${args.customerPhone || 'Not provided'}`,
    `Service: ${args.serviceSummary || 'Not provided'}`,
    `Address: ${args.serviceAddress || 'Not provided'}`,
    `Next action by: ${formatDate(args.nextActionAt)}`,
  ]
  const noteBlock = args.notes?.trim()
    ? `<p><strong>Notes:</strong><br />${escapeHtml(args.notes).replaceAll('\n', '<br />')}</p>`
    : ''

  return {
    html: `
      <p>${ownerIntro(args.kind)}</p>
      <p><strong>${escapeHtml(label)}</strong></p>
      <ul>
        ${detailLines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
      </ul>
      ${noteBlock}
      <p><a href="${escapeHtml(args.workspaceUrl)}">Open the CRM workspace</a></p>
      <p>Grime Time</p>
    `,
    subject,
    text: [
      ownerIntro(args.kind),
      '',
      label,
      ...detailLines,
      args.notes?.trim() ? '' : null,
      args.notes?.trim() ? `Notes:\n${args.notes.trim()}` : null,
      '',
      `Open the CRM workspace: ${args.workspaceUrl}`,
      '',
      'Grime Time',
    ]
      .filter(Boolean)
      .join('\n'),
  }
}
