import { z } from 'zod'

import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { createMonthlyConsolidatedInvoice } from '@/lib/billing/monthlyConsolidation'
import type { Account } from '@/payload-types'

const monthlyConsolidatedSchema = z.object({
  accountId: z.number().int().positive(),
  periodEnd: z.string().datetime(),
  periodStart: z.string().datetime(),
})

export async function POST(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = monthlyConsolidatedSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || 'Invalid monthly billing payload.' },
      { status: 400 },
    )
  }

  const account = (await auth.payload.findByID({
    collection: 'accounts',
    depth: 0,
    id: parsed.data.accountId,
    overrideAccess: false,
    user: auth.user,
  })) as Account

  const invoice = await createMonthlyConsolidatedInvoice({
    account,
    actor: auth.user,
    payload: auth.payload,
    periodEnd: parsed.data.periodEnd,
    periodStart: parsed.data.periodStart,
  })

  return Response.json({
    id: String(invoice.id),
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
  })
}
