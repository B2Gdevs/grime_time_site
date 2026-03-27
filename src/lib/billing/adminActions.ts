import type { Payload } from 'payload'

import type { AdminBillingAction } from '@/lib/billing/constants'
import {
  applyInvoiceCredit,
  markInvoicePaidOutOfBand,
  markInvoiceUncollectible,
  refundInvoice,
  syncInvoiceToStripe,
} from '@/lib/billing/stripe/invoices'
import type { Account, Invoice, User } from '@/payload-types'

async function resolveBillingAccount(args: {
  invoice: Invoice
  payload: Payload
}): Promise<Account | null> {
  const { invoice, payload } = args

  if (typeof invoice.account === 'object' && invoice.account) {
    return invoice.account
  }

  if (invoice.account) {
    return (await payload.findByID({
      collection: 'accounts',
      id: invoice.account,
      depth: 0,
    })) as Account
  }

  if (typeof invoice.customerUser === 'object' && invoice.customerUser?.account) {
    if (typeof invoice.customerUser.account === 'object') {
      return invoice.customerUser.account
    }

    return (await payload.findByID({
      collection: 'accounts',
      id: invoice.customerUser.account,
      depth: 0,
    })) as Account
  }

  return null
}

export async function runAdminBillingAction(args: {
  action: AdminBillingAction
  actor: User
  amount?: number
  invoiceId: number
  note?: null | string
  payload: Payload
  paymentSource?: Invoice['paymentSource']
  paymentReference?: null | string
}) {
  const { action, actor, amount, invoiceId, note, payload, paymentReference, paymentSource } = args

  const invoice = (await payload.findByID({
    collection: 'invoices',
    depth: 1,
    id: invoiceId,
  })) as Invoice

  const account = await resolveBillingAccount({
    invoice,
    payload,
  })

  if (!account) {
    throw new Error('This invoice does not have an account linked for billing operations.')
  }

  switch (action) {
    case 'sync_send_invoice':
      return syncInvoiceToStripe({
        account,
        actor,
        invoice,
        payload,
      })
    case 'mark_paid_out_of_band':
      return markInvoicePaidOutOfBand({
        account,
        actor,
        invoice,
        note,
        payload,
        paymentSource,
        paymentReference,
      })
    case 'apply_discount':
      return applyInvoiceCredit({
        account,
        action,
        actor,
        amount,
        invoice,
        note,
        payload,
      })
    case 'issue_credit':
      return applyInvoiceCredit({
        account,
        action,
        actor,
        amount,
        invoice,
        note,
        payload,
      })
    case 'issue_refund':
      return refundInvoice({
        account,
        actor,
        amount,
        invoice,
        note,
        payload,
      })
    case 'mark_uncollectible':
      return markInvoiceUncollectible({
        account,
        actor,
        invoice,
        note,
        payload,
      })
  }
}
