import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { loadCrmWorkspace } from '@/lib/crm/workspace'

export async function GET(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const searchQuery = url.searchParams.get('q')?.trim() || undefined

  const workspace = await loadCrmWorkspace({
    payload: auth.payload,
    searchQuery,
    user: auth.user,
  })

  return Response.json(workspace)
}
