import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { isAdminUser } from '@/lib/auth/roles'
import type { User } from '@/payload-types'

export async function GET(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !userIsAdmin(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await auth.payload.find({
    collection: 'users',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: 'name',
    user: auth.user,
  })

  const options = (users.docs as User[])
    .filter((user) => isAdminUser(user))
    .map((user) => ({
      email: user.email,
      id: String(user.id),
      label: user.name?.trim() || user.email,
    }))

  return Response.json({ options })
}
