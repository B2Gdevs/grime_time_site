import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'

export async function GET() {
  const auth = await getCurrentAuthContext()

  return Response.json({
    user: auth.effectiveUser,
  })
}
