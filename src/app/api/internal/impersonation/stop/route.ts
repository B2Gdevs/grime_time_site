import { cookies } from 'next/headers'

import { IMPERSONATION_COOKIE_NAME } from '@/lib/auth/impersonation'
import { requireRequestAuth } from '@/lib/auth/requirePayloadUser'

export async function POST(request: Request) {
  const auth = await requireRequestAuth(request)

  if (!auth || !auth.isRealAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATION_COOKIE_NAME, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return Response.json({ ok: true })
}

