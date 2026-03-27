import { z } from 'zod'

import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { adminBillingActionOptions } from '@/lib/billing/constants'
import { runAdminBillingAction } from '@/lib/billing/adminActions'

const invoiceActionSchema = z.object({
  action: z.enum(adminBillingActionOptions),
  amount: z.number().min(0).optional(),
  id: z.number().int().positive(),
  note: z.string().trim().max(500).optional(),
  paymentSource: z
    .enum(['stripe', 'onsite', 'check', 'cash', 'bank_transfer', 'other'])
    .optional(),
  paymentReference: z.string().trim().max(200).optional(),
})

export async function POST(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = invoiceActionSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message || 'Invalid billing action payload.' }, { status: 400 })
  }

  if (
    ['apply_discount', 'issue_credit', 'issue_refund'].includes(parsed.data.action) &&
    !(typeof parsed.data.amount === 'number' && parsed.data.amount > 0)
  ) {
    return Response.json({ error: 'A positive amount is required for that billing action.' }, { status: 400 })
  }

  const invoice = await runAdminBillingAction({
    action: parsed.data.action,
    actor: auth.user,
    amount: parsed.data.amount,
    invoiceId: parsed.data.id,
    note: parsed.data.note,
    payload: auth.payload,
    paymentSource: parsed.data.paymentSource,
    paymentReference: parsed.data.paymentReference,
  })

  return Response.json({
    balanceDue: invoice.balanceDue ?? 0,
    id: String(invoice.id),
    paymentUrl: invoice.stripeHostedInvoiceURL || invoice.paymentUrl || null,
    status: invoice.status,
  })
}
