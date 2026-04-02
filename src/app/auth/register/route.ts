import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { z } from 'zod'

import config from '@payload-config'
import { USERS_COLLECTION_SLUG } from '@/collections/Users'
import { isClerkCustomerAuthPrimaryServer } from '@/lib/auth/customerAuthMode'
import type { User } from '@/payload-types'
import { getCustomerAuthEmailIssue, normalizeCustomerAuthEmail } from '@/lib/auth/customerEmail'
import { isAdminUser } from '@/lib/auth/roles'

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(128),
})

export async function POST(request: Request) {
  if (isClerkCustomerAuthPrimaryServer()) {
    return NextResponse.json(
      { error: 'Customer account creation now runs through the hosted Grime Time sign-in flow.' },
      { status: 409 },
    )
  }

  const payload = await getPayload({ config })

  const json = await request.json().catch(() => null)
  const parsed = registerSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Enter a valid name, email address, and password (8+ characters).' },
      { status: 400 },
    )
  }

  const email = normalizeCustomerAuthEmail(parsed.data.email)
  const emailIssue = getCustomerAuthEmailIssue(email)

  if (emailIssue) {
    return NextResponse.json({ error: emailIssue }, { status: 400 })
  }

  const existingUsers = await payload.find({
    collection: USERS_COLLECTION_SLUG,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: email,
      },
    },
  })

  if (existingUsers.totalDocs > 0) {
    const existingUser = (existingUsers.docs[0] as User | undefined) ?? null

    if (existingUser && isAdminUser(existingUser)) {
      return NextResponse.json(
        {
          error:
            'That email is reserved for staff sign-in. Use the Grime Time sign-in flow for team access, then open /ops or /admin.',
        },
        { status: 409 },
      )
    }

    return NextResponse.json({ success: true, userExists: true })
  }

  const userCount = await payload.find({
    collection: USERS_COLLECTION_SLUG,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
  })

  if (userCount.totalDocs === 0) {
    return NextResponse.json(
      {
        error:
          'Set up the first staff account through the Grime Time sign-in flow before opening public customer registration.',
      },
      { status: 409 },
    )
  }

  await payload.create({
    collection: USERS_COLLECTION_SLUG,
    data: {
      email,
      name: parsed.data.name.trim(),
      password: parsed.data.password,
      roles: ['customer'],
    },
    overrideAccess: true,
  })

  return NextResponse.json({ success: true })
}
