import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { updateLeadStatus } from '@/lib/crm/workspace'

const VALID_STATUSES = ['disqualified', 'qualified'] as const

export async function PATCH(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as null | {
    id?: number
    status?: (typeof VALID_STATUSES)[number]
  }

  if (!body?.id || !body.status || !VALID_STATUSES.includes(body.status)) {
    return Response.json({ error: 'Invalid or missing id/status' }, { status: 400 })
  }

  const lead = await updateLeadStatus({
    id: Number(body.id),
    payload: auth.payload,
    status: body.status,
    user: auth.user,
  })

  return Response.json({
    id: String(lead.id),
    status: lead.status,
  })
}
