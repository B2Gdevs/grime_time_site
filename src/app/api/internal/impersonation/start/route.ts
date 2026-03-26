import { cookies } from 'next/headers'
import { z } from 'zod'

import { IMPERSONATION_COOKIE_NAME } from '@/lib/auth/impersonation'
import { requirePayloadUser } from '@/lib/auth/requirePayloadUser'
import { isAdminUser } from '@/lib/auth/roles'
import type { User } from '@/payload-types'

const payloadSchema = z.object({
  userId: z.coerce.number().int().positive(),
})

export async function POST(request: Request) {
  const auth = await requirePayloadUser(request)

  if (!auth || !isAdminUser(auth.user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = payloadSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: 'Invalid impersonation request.' }, { status: 400 })
  }

  const target = (await auth.payload.findByID({
    collection: 'users',
    depth: 0,
    id: parsed.data.userId,
    overrideAccess: false,
    user: auth.user,
  })) as User

  if (!target || isAdminUser(target)) {
    return Response.json({ error: 'Only non-admin users can be impersonated.' }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATION_COOKIE_NAME, String(target.id), {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return Response.json({
    ok: true,
    user: {
      email: target.email,
      id: target.id,
      name: target.name?.trim() || target.email,
    },
  })
}

