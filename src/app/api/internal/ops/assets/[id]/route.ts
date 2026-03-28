import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { deleteOpsAsset, updateOpsAsset } from '@/lib/ops/assets/workspace'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = await context.params
  const id = Number(params.id)
  const body = (await request.json().catch(() => null)) as
    | null
    | {
        buyNotes?: string
        label?: string
        owned?: boolean
        sortOrder?: number
        whyNotes?: string
      }

  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: 'Invalid asset id.' }, { status: 400 })
  }

  const label = body?.label?.trim()
  if (!label) {
    return Response.json({ error: 'Asset name is required.' }, { status: 400 })
  }

  const item = await updateOpsAsset({
    data: {
      buyNotes: body?.buyNotes,
      label,
      owned: body?.owned,
      sortOrder: body?.sortOrder,
      whyNotes: body?.whyNotes,
    },
    id,
    payload: auth.payload,
    user: auth.user,
  })

  return Response.json({ item })
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = await context.params
  const id = Number(params.id)

  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: 'Invalid asset id.' }, { status: 400 })
  }

  await deleteOpsAsset({
    id,
    payload: auth.payload,
    user: auth.user,
  })

  return Response.json({ ok: true })
}
