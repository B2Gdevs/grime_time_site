import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { markOpsWelcomeSeen } from '@/lib/ops/welcome'

export async function POST() {
  const auth = await getCurrentAuthContext()

  if (!auth.isRealAdmin || !auth.realUser?.id) {
    return Response.json({ error: 'Not authorized.' }, { status: 401 })
  }

  await markOpsWelcomeSeen(auth.payload, Number(auth.realUser.id))

  return Response.json({ ok: true })
}
