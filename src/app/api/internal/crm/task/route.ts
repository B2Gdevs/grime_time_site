import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { updateCrmTaskStatus } from '@/lib/crm/workspace'

export async function PATCH(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as null | {
    id?: number
    status?: 'completed' | 'in_progress'
  }

  if (!body?.id || !body.status || !['completed', 'in_progress'].includes(body.status)) {
    return Response.json({ error: 'Invalid or missing id/status' }, { status: 400 })
  }

  const task = await updateCrmTaskStatus({
    id: Number(body.id),
    payload: auth.payload,
    status: body.status,
    user: auth.user,
  })

  return Response.json({
    completedAt: task.completedAt ?? null,
    id: String(task.id),
    status: task.status,
  })
}
