import config from '@payload-config'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'

export async function requirePayloadUser(request: Request): Promise<null | {
  payload: Awaited<ReturnType<typeof getPayload>>
  user: User
}> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return null
  }

  return {
    payload,
    user: user as User,
  }
}
