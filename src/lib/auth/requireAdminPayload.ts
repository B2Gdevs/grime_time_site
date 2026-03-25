import config from '@payload-config'
import { getPayload } from 'payload'

import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import type { User } from '@/payload-types'

/** Returns Payload instance when the request is from an admin user; otherwise null. */
export async function requireAdminPayload(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })

  if (!userIsAdmin(user as User | null)) {
    return null
  }

  return payload
}
