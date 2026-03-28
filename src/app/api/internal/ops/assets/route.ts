import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { createOpsAsset, loadOpsAssetsWorkspace } from '@/lib/ops/assets/workspace'

export async function GET(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await loadOpsAssetsWorkspace({
    payload: auth.payload,
    user: auth.user,
  })

  return Response.json({ items })
}

export async function POST(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as
    | null
    | {
        buyNotes?: string
        label?: string
        owned?: boolean
        sortOrder?: number
        whyNotes?: string
      }

  const label = body?.label?.trim()
  if (!label) {
    return Response.json({ error: 'Asset name is required.' }, { status: 400 })
  }

  const item = await createOpsAsset({
    data: {
      buyNotes: body?.buyNotes,
      label,
      owned: body?.owned,
      sortOrder: body?.sortOrder,
      whyNotes: body?.whyNotes,
    },
    payload: auth.payload,
    user: auth.user,
  })

  return Response.json({ item })
}
