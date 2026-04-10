import { z } from 'zod'

import { requireRequestAuth } from '@/lib/auth/requirePayloadUser'
import {
  OpsCustomerAdminError,
  performOpsCustomerAdminAction,
  type OpsCustomerAdminAction,
} from '@/lib/ops/customerAdmin'

type RouteContext = {
  params: Promise<{ id: string }>
}

const customerActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('repair_stripe_customer'),
    userId: z.number().int().positive().optional(),
  }),
  z.object({
    action: z.literal('send_portal_access'),
    userId: z.number().int().positive(),
  }),
  z.object({
    action: z.literal('set_primary_customer'),
    userId: z.number().int().positive(),
  }),
])

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireRequestAuth(request)

  if (!auth?.isRealAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = await context.params
  const id = Number(params.id)

  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: 'Invalid account id.' }, { status: 400 })
  }

  const parsed = customerActionSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || 'Invalid customer action payload.' },
      { status: 400 },
    )
  }

  try {
    const result = await performOpsCustomerAdminAction({
      action: parsed.data as OpsCustomerAdminAction,
      payload: auth.payload,
      targetAccountId: id,
    })

    return Response.json(result)
  } catch (error) {
    if (error instanceof OpsCustomerAdminError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    return Response.json({ error: 'Unable to update the customer account right now.' }, { status: 500 })
  }
}
