import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generatePayloadCookie, getFieldsToSign, jwtSign } from 'payload'

import { USERS_COLLECTION_SLUG } from '@/collections/Users'
import { requireRequestAuth } from '@/lib/auth/requirePayloadUser'

function sanitizeNextPath(value: null | string): string {
  if (!value || !value.startsWith('/')) {
    return '/admin'
  }

  if (value.startsWith('//')) {
    return '/admin'
  }

  return value
}

export async function GET(request: Request): Promise<Response> {
  const auth = await requireRequestAuth(request)

  if (!auth?.realUser || !auth.isRealAdmin) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const usersCollection = auth.payload.collections[USERS_COLLECTION_SLUG]
  const authConfig = usersCollection?.config?.auth

  if (!usersCollection?.config || !authConfig) {
    return NextResponse.json({ error: 'Payload admin auth is unavailable.' }, { status: 500 })
  }

  const fieldsToSign = getFieldsToSign({
    collectionConfig: usersCollection.config,
    email: auth.realUser.email,
    user: auth.realUser,
  })
  const { token } = await jwtSign({
    fieldsToSign,
    secret: auth.payload.config.secret,
    tokenExpiration: authConfig.tokenExpiration,
  })
  const payloadCookie = generatePayloadCookie({
    collectionAuthConfig: authConfig,
    cookiePrefix: auth.payload.config.cookiePrefix,
    returnCookieAsObject: true,
    token,
  })
  const cookieStore = await cookies()

  cookieStore.set(payloadCookie.name, payloadCookie.value ?? '', {
    domain: payloadCookie.domain,
    expires: payloadCookie.expires ? new Date(payloadCookie.expires) : undefined,
    httpOnly: true,
    path: payloadCookie.path || '/',
    sameSite:
      typeof payloadCookie.sameSite === 'string'
        ? payloadCookie.sameSite.toLowerCase() === 'strict'
          ? 'strict'
          : payloadCookie.sameSite.toLowerCase() === 'none'
            ? 'none'
            : 'lax'
        : 'lax',
    secure: payloadCookie.secure ?? false,
  })

  const nextPath = sanitizeNextPath(new URL(request.url).searchParams.get('next'))
  return NextResponse.redirect(new URL(nextPath, request.url))
}
