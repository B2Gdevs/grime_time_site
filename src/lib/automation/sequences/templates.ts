import type { Payload } from 'payload'

import { buildAppointmentEmail, buildInvoiceIssuedEmail, buildLeadAcknowledgementEmail, buildQuoteSentEmail } from '@/lib/email/customerLifecycle'
import { resolvePortalAccessCta } from '@/lib/email/portalAccessCta'
import type { CustomerEmailMessage } from '@/lib/email/types'
import { getServerSideURL } from '@/utilities/getURL'
import type { Invoice, Lead, Quote, SequenceEnrollment, ServiceAppointment } from '@/payload-types'

export async function renderSequenceEmail(args: {
  enrollment: SequenceEnrollment
  payload: Payload
  templateKey: string
}): Promise<null | { message: CustomerEmailMessage; to: string }> {
  const quote =
    typeof args.enrollment.quote === 'object' && args.enrollment.quote ? (args.enrollment.quote as Quote) : null
  const invoice =
    typeof args.enrollment.invoice === 'object' && args.enrollment.invoice
      ? (args.enrollment.invoice as Invoice)
      : null
  const appointment =
    typeof args.enrollment.serviceAppointment === 'object' && args.enrollment.serviceAppointment
      ? (args.enrollment.serviceAppointment as ServiceAppointment)
      : null
  const lead =
    typeof args.enrollment.lead === 'object' && args.enrollment.lead ? (args.enrollment.lead as Lead) : null

  switch (args.templateKey) {
    case 'lead_follow_up': {
      if (!lead?.customerEmail) return null
      return {
        message: buildLeadAcknowledgementEmail({
          customerName: lead.customerName,
          detailLabel: 'request follow-up',
        }),
        to: lead.customerEmail,
      }
    }

    case 'quote_follow_up': {
      if (!quote?.customerEmail) return null
      const portalCta = await resolvePortalAccessCta({
        customerEmail: quote.customerEmail,
        customerUser: quote.customerUser,
        nextPath: '/estimates',
        payload: args.payload,
      })

      return {
        message: buildQuoteSentEmail({
          customerName: quote.customerName,
          portalCta,
          scheduleUrl: `${getServerSideURL()}/service-schedule`,
          total: quote.pricing?.total || null,
          validUntil: quote.validUntil,
        }),
        to: quote.customerEmail,
      }
    }

    case 'invoice_reminder':
    case 'invoice_overdue': {
      if (!invoice?.customerEmail) return null
      const portalCta = await resolvePortalAccessCta({
        customerEmail: invoice.customerEmail,
        customerUser: invoice.customerUser,
        nextPath: '/invoices',
        payload: args.payload,
      })

      return {
        message: buildInvoiceIssuedEmail({
          amountDue: invoice.balanceDue || invoice.total || 0,
          customerName: invoice.customerName,
          dueDate: invoice.dueDate,
          invoiceNumber: invoice.invoiceNumber,
          paymentUrl: invoice.stripeHostedInvoiceURL || invoice.paymentUrl,
          portalCta,
          portalUrl: `${getServerSideURL()}/invoices`,
        }),
        to: invoice.customerEmail,
      }
    }

    case 'service_follow_up': {
      if (!appointment?.customerEmail) return null
      const portalCta = await resolvePortalAccessCta({
        customerEmail: appointment.customerEmail,
        customerUser: appointment.customerUser,
        nextPath: '/service-schedule',
        payload: args.payload,
      })

      return {
        message: buildAppointmentEmail({
          customerName: appointment.customerName,
          portalCta,
          portalUrl: `${getServerSideURL()}/service-schedule`,
          scheduledLabel:
            appointment.scheduledStart != null
              ? `Scheduled for ${new Date(appointment.scheduledStart).toLocaleString()}.`
              : 'Review your service schedule in the portal.',
          statusLabel: appointment.status,
        }),
        to: appointment.customerEmail,
      }
    }

    default:
      return null
  }
}
