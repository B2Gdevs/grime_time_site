import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { z } from 'zod'

import config from '@payload-config'
import { USERS_COLLECTION_SLUG } from '@/collections/Users'

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(128),
})

export async function POST(request: Request) {
  const payload = await getPayload({ config })

  const json = await request.json().catch(() => null)
  const parsed = registerSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Enter a valid name, email address, and password (8+ characters).' },
      { status: 400 },
    )
  }

  const email = parsed.data.email.trim().toLowerCase()

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
    return NextResponse.json(
      { error: 'An account with that email already exists. Try signing in instead.' },
      { status: 409 },
    )
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
          'Set up the first admin account at /admin/login before opening public customer registration.',
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
