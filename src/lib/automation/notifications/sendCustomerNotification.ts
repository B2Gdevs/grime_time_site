import type { Payload } from 'payload'

import { buildAppointmentEmail, buildInvoiceIssuedEmail, buildLeadAcknowledgementEmail, buildQuoteSentEmail } from '@/lib/email/customerLifecycle'
import { resolvePortalAccessCta } from '@/lib/email/portalAccessCta'
import { createBillingEvent } from '@/lib/billing/events'
import { formatCurrency, formatDate, sentenceCase } from '@/lib/customers/format'
import { getServerSideURL } from '@/utilities/getURL'
import type { Invoice, Lead, Quote, ServiceAppointment } from '@/payload-types'

import type { CustomerNotificationType } from './constants'

export type CustomerNotificationInput = {
  appointmentId?: number | string
  invoiceId?: number | string
  leadId?: number | string
  quoteId?: number | string
  type: CustomerNotificationType
}

async function loadQuote(payload: Payload, id: number | string) {
  return (await payload.findByID({
    collection: 'quotes',
    depth: 1,
    id,
    overrideAccess: true,
  })) as Quote
}

async function loadInvoice(payload: Payload, id: number | string) {
  return (await payload.findByID({
    collection: 'invoices',
    depth: 1,
    id,
    overrideAccess: true,
  })) as Invoice
}

async function loadAppointment(payload: Payload, id: number | string) {
  return (await payload.findByID({
    collection: 'service-appointments',
    depth: 1,
    id,
    overrideAccess: true,
  })) as ServiceAppointment
}

async function loadLead(payload: Payload, id: number | string) {
  return (await payload.findByID({
    collection: 'leads',
    depth: 1,
    id,
    overrideAccess: true,
  })) as Lead
}

function appointmentStatusLabel(appointment: ServiceAppointment) {
  if (appointment.status === 'confirmed') return 'confirmed'
  if (appointment.status === 'reschedule_requested') return 'waiting on reschedule review'
  if (appointment.status === 'completed') return 'completed'
  return sentenceCase(appointment.status)
}

function appointmentScheduledLabel(appointment: ServiceAppointment) {
  if (appointment.scheduledStart) {
    return `Scheduled for ${formatDate(appointment.scheduledStart)}${
      appointment.arrivalWindow ? ` (${sentenceCase(appointment.arrivalWindow)})` : ''
    }.`
  }

  if (appointment.requestedDate) {
    return `Requested date: ${formatDate(appointment.requestedDate)}.`
  }

  return 'Review the schedule in your portal for the latest service timing.'
}

export async function sendCustomerNotification(payload: Payload, input: CustomerNotificationInput) {
  switch (input.type) {
    case 'lead_acknowledgement': {
      if (!input.leadId) return
      const lead = await loadLead(payload, input.leadId)
      if (!lead.customerEmail) return

      const message = buildLeadAcknowledgementEmail({
        customerName: lead.customerName,
        detailLabel:
          lead.source === 'instant_quote'
            ? 'estimate request'
            : lead.source === 'schedule_request'
              ? 'schedule request'
              : 'message',
      })

      await payload.sendEmail({
        html: message.html,
        subject: message.subject,
        text: message.text,
        to: lead.customerEmail,
      })

      return
    }

    case 'quote_sent': {
      if (!input.quoteId) return
      const quote = await loadQuote(payload, input.quoteId)
      if (!quote.customerEmail) return

      const portalCta = await resolvePortalAccessCta({
        customerEmail: quote.customerEmail,
        customerUser: quote.customerUser,
        nextPath: '/estimates',
        payload,
      })

      const message = buildQuoteSentEmail({
        customerName: quote.customerName,
        portalCta,
        scheduleUrl: `${getServerSideURL()}/service-schedule`,
        total: quote.pricing?.total || null,
        validUntil: quote.validUntil,
      })

      await payload.sendEmail({
        html: message.html,
        subject: message.subject,
        text: message.text,
        to: quote.customerEmail,
      })

      return
    }

    case 'invoice_issued':
    case 'invoice_overdue': {
      if (!input.invoiceId) return
      const invoice = await loadInvoice(payload, input.invoiceId)
      if (!invoice.customerEmail) return

      const portalCta = await resolvePortalAccessCta({
        customerEmail: invoice.customerEmail,
        customerUser: invoice.customerUser,
        nextPath: '/invoices',
        payload,
      })

      const message = buildInvoiceIssuedEmail({
        amountDue: input.type === 'invoice_overdue' ? invoice.balanceDue || invoice.total || 0 : invoice.balanceDue || invoice.total || 0,
        customerName: invoice.customerName,
        dueDate: invoice.dueDate,
        invoiceNumber: invoice.invoiceNumber,
        paymentUrl: invoice.stripeHostedInvoiceURL || invoice.paymentUrl,
        portalCta,
        portalUrl: `${getServerSideURL()}/invoices`,
      })

      await payload.sendEmail({
        html: message.html,
        subject:
          input.type === 'invoice_overdue'
            ? `Past due: invoice ${invoice.invoiceNumber}`
            : message.subject,
        text:
          input.type === 'invoice_overdue'
            ? message.text.replace(
                `Invoice ${invoice.invoiceNumber} is ready`,
                `Invoice ${invoice.invoiceNumber} is now overdue with ${formatCurrency(invoice.balanceDue || invoice.total || 0)} still due`,
              )
            : message.text,
        to: invoice.customerEmail,
      })

      await payload.update({
        collection: 'invoices',
        id: invoice.id,
        data: {
          deliveryStatus: 'sent',
        },
        overrideAccess: true,
      })

      await createBillingEvent({
        accountId: typeof invoice.account === 'object' ? invoice.account?.id : null,
        customerUserId: typeof invoice.customerUser === 'object' ? invoice.customerUser?.id : null,
        eventLabel:
          input.type === 'invoice_overdue'
            ? `Overdue reminder sent for invoice ${invoice.invoiceNumber}`
            : `Invoice email sent for ${invoice.invoiceNumber}`,
        eventType: input.type === 'invoice_overdue' ? 'invoice_overdue' : 'invoice_sent',
        invoiceId: invoice.id,
        payload,
        processedAt: new Date().toISOString(),
        sourceSystem: 'internal',
      })

      return
    }

    case 'appointment_update': {
      if (!input.appointmentId) return
      const appointment = await loadAppointment(payload, input.appointmentId)
      if (!appointment.customerEmail) return

      const portalCta = await resolvePortalAccessCta({
        customerEmail: appointment.customerEmail,
        customerUser: appointment.customerUser,
        nextPath: '/service-schedule',
        payload,
      })

      const message = buildAppointmentEmail({
        customerName: appointment.customerName,
        portalCta,
        portalUrl: `${getServerSideURL()}/service-schedule`,
        scheduledLabel: appointmentScheduledLabel(appointment),
        statusLabel: appointmentStatusLabel(appointment),
      })

      await payload.sendEmail({
        html: message.html,
        subject: message.subject,
        text: message.text,
        to: appointment.customerEmail,
      })

      return
    }
  }
}
