import { requireEffectivePayloadUser } from '@/lib/auth/requirePayloadUser'
import { customerAccountSchema } from '@/lib/forms/customerAccount'

export async function POST(request: Request) {
  const auth = await requireEffectivePayloadUser(request)

  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = customerAccountSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || 'Invalid account payload.' },
      { status: 400 },
    )
  }

  await auth.payload.update({
    collection: 'users',
    id: auth.user.id,
    data: parsed.data,
    overrideAccess: false,
    user: auth.user,
  })

  return Response.json({ message: 'Your account details are updated.' })
}
