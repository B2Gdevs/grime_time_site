import { getPayload } from 'payload'

import type { User } from '@/payload-types'
import { isLocalDevtoolsRequestHeaders } from '@/lib/auth/localDevtools'

export async function loadLocalDevBypassUser(args: {
  payload: Awaited<ReturnType<typeof getPayload>>
  requestHeaders: Headers
}): Promise<User | null> {
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  if (process.env.GT_DEV_AUTH_BYPASS !== 'true') {
    return null
  }

  if (!isLocalDevtoolsRequestHeaders(args.requestHeaders)) {
    return null
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim()

  if (!adminEmail) {
    return null
  }

  try {
    const result = await args.payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        email: {
          equals: adminEmail,
        },
      },
    })

    return ((result.docs?.[0] as User | undefined) ?? null)
  } catch {
    return null
  }
}
