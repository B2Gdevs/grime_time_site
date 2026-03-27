import { cookies } from 'next/headers'

import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { GRIME_DEMO_MODE_KEY } from '@/lib/demo/constants'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { loadCrmWorkspace } from '@/lib/crm/workspace'

const OWNER_SCOPES = ['all', 'mine', 'unassigned'] as const

function parseOwnerScope(value: null | string) {
  if (value && OWNER_SCOPES.includes(value as (typeof OWNER_SCOPES)[number])) {
    return value as (typeof OWNER_SCOPES)[number]
  }

  return 'all'
}

export async function GET(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const commercialOnly = url.searchParams.get('commercial') === '1'
  const ownerScope = parseOwnerScope(url.searchParams.get('owner'))
  const searchQuery = url.searchParams.get('q')?.trim() || undefined
  const cookieStore = await cookies()
  const demoMode = cookieStore.get(GRIME_DEMO_MODE_KEY)?.value === '1'

  const workspace = await loadCrmWorkspace({
    commercialOnly,
    demoMode,
    ownerScope,
    payload: auth.payload,
    searchQuery,
    user: auth.user,
  })

  return Response.json(workspace)
}
