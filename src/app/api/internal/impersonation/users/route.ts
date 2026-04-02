import type { Where } from 'payload'

import { NextResponse } from 'next/server'

import { hasPayloadAdminAccess } from '@/lib/auth/organizationAccess'
import { requireRequestAuth } from '@/lib/auth/requirePayloadUser'
import type { User } from '@/payload-types'

type ImpersonationUserOption = {
  accountName: null | string
  company: null | string
  email: string
  id: number | string
  isCurrent: boolean
  name: string
}

function userLabel(user: User): string {
  return user.name?.trim() || user.email
}

function accountNameForUser(user: User): null | string {
  if (!user.account || typeof user.account !== 'object' || !('name' in user.account)) {
    return null
  }

  return typeof user.account.name === 'string' ? user.account.name : null
}

export async function GET(request: Request) {
  const auth = await requireRequestAuth(request)

  if (!auth || !auth.isRealAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const query = url.searchParams.get('q')?.trim() ?? ''
  const where: undefined | Where =
    query.length > 0
      ? {
          or: [
            {
              name: {
                contains: query,
              },
            },
            {
              email: {
                contains: query.toLowerCase(),
              },
            },
            {
              company: {
                contains: query,
              },
            },
          ],
        }
      : undefined

  const users = await auth.payload.find({
    collection: 'users',
    depth: 1,
    limit: 20,
    overrideAccess: false,
    sort: '-updatedAt',
    user: auth.realUser,
    where,
  })

  const options: ImpersonationUserOption[] = (
    await Promise.all(
      (users.docs as User[]).map(async (candidate) => ({
        candidate,
        isAdmin: await hasPayloadAdminAccess(auth.payload, candidate),
      })),
    )
  )
    .filter(({ isAdmin }) => !isAdmin)
    .map(({ candidate }) => ({
      accountName: accountNameForUser(candidate),
      company: candidate.company?.trim() || null,
      email: candidate.email,
      id: candidate.id,
      isCurrent: String(candidate.id) === String(auth.realUser.id),
      name: userLabel(candidate),
    }))

  return NextResponse.json({
    users: options,
  })
}
