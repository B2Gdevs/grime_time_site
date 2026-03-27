import config from '@payload-config'
import { getPayload } from 'payload'

import { findCustomerUserByEmail, findPortalAccessPreviewByToken, issuePortalAccess } from '@/lib/auth/portal-access/claims'
import { claimAccountRequestSchema } from '@/lib/forms/portalAccess'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')?.trim()

  if (!token) {
    return Response.json({ error: 'Missing claim token.' }, { status: 400 })
  }

  const preview = await findPortalAccessPreviewByToken(token)

  if (!preview) {
    return Response.json({ error: 'That claim link is invalid or expired.' }, { status: 404 })
  }

  return Response.json({ preview })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const body = await request.json().catch(() => null)
  const parsed = claimAccountRequestSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message || 'Enter a valid email address.' }, { status: 400 })
  }

  const user = await findCustomerUserByEmail(parsed.data.email, payload)

  if (user) {
    await issuePortalAccess({
      accountName: user.company || null,
      mode: 'claim',
      payload,
      user,
    })
  }

  return Response.json({
    message: 'If that email already has a Grime Time account, we sent a secure claim link.',
  })
}
