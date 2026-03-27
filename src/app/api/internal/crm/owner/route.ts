import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { assignCrmRecordOwner, isOwnerAssignableKind } from '@/lib/crm/workspace'

export async function PATCH(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as null | {
    id?: number
    kind?: string
    ownerId?: null | number
  }
  const kind = typeof body?.kind === 'string' ? body.kind : null

  if (!body?.id || !kind || !isOwnerAssignableKind(kind)) {
    return Response.json({ error: 'Invalid or missing id/kind' }, { status: 400 })
  }

  const updated = await assignCrmRecordOwner({
    id: Number(body.id),
    kind,
    ownerId: typeof body.ownerId === 'number' && body.ownerId > 0 ? body.ownerId : null,
    payload: auth.payload,
    user: auth.user,
  })

  return Response.json({
    id: String(updated.id),
    ownerId:
      typeof updated.owner === 'object' && updated.owner
        ? String(updated.owner.id)
        : typeof updated.owner === 'number' || typeof updated.owner === 'string'
          ? String(updated.owner)
          : null,
  })
}
