import { formatCurrency, formatDate } from '@/lib/customers/format'
import { portalAccessHtml, portalAccessText } from '@/lib/email/fragments'
import type { PortalAccessCta } from '@/lib/email/portalAccessCta'
import type { CustomerEmailMessage } from '@/lib/email/types'

export function buildLeadAcknowledgementEmail(args: {
  customerName?: null | string
  detailLabel: string
}): CustomerEmailMessage {
  const customerName = args.customerName?.trim() || 'there'
  return {
    html: `
      <p>Hi ${customerName},</p>
      <p>We received your ${args.detailLabel} and saved it in our queue.</p>
      <p>A Grime Time team member will review the details and follow up with the next step.</p>
      <p>Grime Time</p>
    `,
    subject: 'We received your request',
    text: [
      `Hi ${customerName},`,
      '',
      `We received your ${args.detailLabel} and saved it in our queue.`,
      'A Grime Time team member will review the details and follow up with the next step.',
      '',
      'Grime Time',
    ].join('\n'),
  }
}

export function buildQuoteSentEmail(args: {
  customerName?: null | string
  portalCta: null | PortalAccessCta
  scheduleUrl: string
  total?: null | number
  validUntil?: null | string
}): CustomerEmailMessage {
  const customerName = args.customerName?.trim() || 'there'
  const totalLine = typeof args.total === 'number' ? `Current total: ${formatCurrency(args.total)}.` : ''
  const validUntilLine = args.validUntil ? `Valid through ${formatDate(args.validUntil)}.` : ''

  return {
    html: `
      <p>Hi ${customerName},</p>
      <p>Your Grime Time estimate is ready. ${totalLine} ${validUntilLine}</p>
      <p>If you are ready to move forward, reply to this email or book your next step here: <a href="${args.scheduleUrl}">${args.scheduleUrl}</a></p>
      ${portalAccessHtml(args.portalCta)}
      <p>Grime Time</p>
    `,
    subject: 'Your Grime Time estimate is ready',
    text: [
      `Hi ${customerName},`,
      '',
      'Your Grime Time estimate is ready.',
      totalLine,
      validUntilLine,
      '',
      `If you are ready to move forward, reply to this email or book your next step here: ${args.scheduleUrl}`,
      portalAccessText(args.portalCta),
      '',
      'Grime Time',
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

export function buildInvoiceIssuedEmail(args: {
  amountDue: number
  customerName?: null | string
  dueDate?: null | string
  invoiceNumber: string
  paymentUrl?: null | string
  portalCta: null | PortalAccessCta
  portalUrl: string
}): CustomerEmailMessage {
  const customerName = args.customerName?.trim() || 'there'
  const paymentLine = args.paymentUrl ? `Pay online here: ${args.paymentUrl}` : `Review billing here: ${args.portalUrl}`

  return {
    html: `
      <p>Hi ${customerName},</p>
      <p>Invoice <strong>${args.invoiceNumber}</strong> is ready for ${formatCurrency(args.amountDue)}${args.dueDate ? ` and is due ${formatDate(args.dueDate)}` : ''}.</p>
      <p>${args.paymentUrl ? `<a href="${args.paymentUrl}">Pay this invoice online</a>` : `<a href="${args.portalUrl}">Review billing in your portal</a>`}</p>
      ${portalAccessHtml(args.portalCta)}
      <p>Grime Time</p>
    `,
    subject: `Invoice ${args.invoiceNumber} from Grime Time`,
    text: [
      `Hi ${customerName},`,
      '',
      `Invoice ${args.invoiceNumber} is ready for ${formatCurrency(args.amountDue)}${args.dueDate ? ` and is due ${formatDate(args.dueDate)}` : ''}.`,
      paymentLine,
      portalAccessText(args.portalCta),
      '',
      'Grime Time',
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

export function buildAppointmentEmail(args: {
  customerName?: null | string
  portalCta: null | PortalAccessCta
  portalUrl: string
  scheduledLabel: string
  statusLabel: string
}): CustomerEmailMessage {
  const customerName = args.customerName?.trim() || 'there'

  return {
    html: `
      <p>Hi ${customerName},</p>
      <p>Your Grime Time service is now <strong>${args.statusLabel}</strong>.</p>
      <p>${args.scheduledLabel}</p>
      <p><a href="${args.portalUrl}">Review your service schedule</a></p>
      ${portalAccessHtml(args.portalCta)}
      <p>Grime Time</p>
    `,
    subject: `Service update: ${args.statusLabel}`,
    text: [
      `Hi ${customerName},`,
      '',
      `Your Grime Time service is now ${args.statusLabel}.`,
      args.scheduledLabel,
      `Review your service schedule: ${args.portalUrl}`,
      portalAccessText(args.portalCta),
      '',
      'Grime Time',
    ]
      .filter(Boolean)
      .join('\n'),
  }
}
