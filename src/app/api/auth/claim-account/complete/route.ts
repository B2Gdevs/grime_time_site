import { completePortalAccessClaim } from '@/lib/auth/portal-access/claims'
import { resolveCustomerSessionIdentity } from '@/lib/auth/customerSessionIdentity'
import { completeClaimAccountSchema } from '@/lib/forms/portalAccess'

export async function POST(request: Request) {
  const identity = await resolveCustomerSessionIdentity()

  if (!identity?.email) {
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
    clerkUserID: identity.kind === 'clerk' ? identity.clerkUserID : undefined,
    supabaseAuthUserID: identity.kind === 'supabase' ? identity.supabaseAuthUserID : undefined,
    token: parsed.data.token,
    verifiedEmail: identity.email,
  })

  if (!user) {
    return Response.json({ error: 'That account claim is invalid or expired.' }, { status: 404 })
  }

  return Response.json({ message: 'Your account is ready.', userID: user.id })
}
