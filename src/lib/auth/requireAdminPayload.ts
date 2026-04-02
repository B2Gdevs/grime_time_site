import { requireRequestAuth } from '@/lib/auth/requirePayloadUser'

/** Returns Payload instance when the request is from an admin user; otherwise null. */
export async function requireAdminPayload(request: Request) {
  const auth = await requireRequestAuth(request)

  if (!auth?.isRealAdmin) {
    return null
  }

  return auth.payload
}
