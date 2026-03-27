import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { loadBillingWorkspace } from '@/lib/billing/workspace'

export async function GET(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workspace = await loadBillingWorkspace({
    payload: auth.payload,
    user: auth.user,
  })

  return Response.json(workspace)
}
