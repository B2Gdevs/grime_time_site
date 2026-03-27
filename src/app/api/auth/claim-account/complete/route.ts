import { completePortalAccessClaim } from '@/lib/auth/portal-access/claims'
import { completeClaimAccountSchema } from '@/lib/forms/portalAccess'
import { getSupabaseServerUser } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabaseUser = await getSupabaseServerUser()

  if (!supabaseUser?.id || !supabaseUser.email) {
    return Response.json({ error: 'You must finish authentication before claiming this account.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = completeClaimAccountSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || 'Missing claim token.' },
      { status: 400 },
    )
  }

  const user = await completePortalAccessClaim({
    supabaseAuthUserID: supabaseUser.id,
    token: parsed.data.token,
    verifiedEmail: supabaseUser.email,
  })

  if (!user) {
    return Response.json({ error: 'That account claim is invalid or expired.' }, { status: 404 })
  }

  return Response.json({ message: 'Your account is ready.', userID: user.id })
}
