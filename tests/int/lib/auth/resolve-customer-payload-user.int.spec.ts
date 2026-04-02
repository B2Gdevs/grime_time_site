import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'
import type { User } from '@/payload-types'

const resolveCustomerSessionIdentity = vi.fn()

vi.mock('@/lib/auth/customerSessionIdentity', () => ({
  resolveCustomerSessionIdentity,
}))

const runKey = `resolve-customer-payload-user-${Date.now()}`
const created: Array<{ collection: string; id: number | string }> = []

let payload: Payload

async function createUser(data: Record<string, unknown>) {
  const user = (await payload.create({
    collection: 'users',
    data,
    overrideAccess: true,
  } as never)) as User

  created.push({ collection: 'users', id: user.id })
  return user
}

describe('resolveCustomerPayloadUser', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterAll(async () => {
    for (const entry of created.reverse()) {
      await payload.delete({
        collection: entry.collection as never,
        id: entry.id,
        overrideAccess: true,
      })
    }
  })

  it(
    'binds a Clerk-backed admin session onto the existing admin user instead of creating a customer duplicate',
    { timeout: 15000 },
    async () => {
      const adminEmail = `${runKey}.admin@example.com`
      const existingAdmin = await createUser({
        email: adminEmail,
        name: 'Clerk Admin',
        password: 'test-password',
      roles: ['admin'],
    })

    resolveCustomerSessionIdentity.mockResolvedValue({
      clerkUserID: `clerk_${runKey}`,
      email: adminEmail,
      firstName: 'Clerk',
      kind: 'clerk',
      lastName: 'Admin',
      user_metadata: {
        name: 'Clerk Admin',
      },
    })

    const { resolveCustomerPayloadUser } = await import('@/lib/auth/resolveCustomerPayloadUser')
    const result = await resolveCustomerPayloadUser()

    expect(result?.user.id).toBe(existingAdmin.id)
    expect(result?.user.roles).toEqual(expect.arrayContaining(['admin']))
    expect(result?.user.clerkUserID).toBe(`clerk_${runKey}`)

    const users = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      where: {
        email: {
          equals: adminEmail,
        },
      },
    })

      expect(users.docs).toHaveLength(1)
    },
  )

  it(
    'creates a new Clerk-backed customer user with a local-only placeholder password when no Payload user exists yet',
    { timeout: 15000 },
    async () => {
      const customerEmail = `${runKey}.new-customer@example.com`

      resolveCustomerSessionIdentity.mockResolvedValue({
        clerkUserID: `clerk_customer_${runKey}`,
        email: customerEmail,
        firstName: 'Fresh',
        kind: 'clerk',
        lastName: 'Customer',
        user_metadata: {
          name: 'Fresh Customer',
        },
      })

      const { resolveCustomerPayloadUser } = await import('@/lib/auth/resolveCustomerPayloadUser')
      const result = await resolveCustomerPayloadUser()

      expect(result?.user.email).toBe(customerEmail)
      expect(result?.user.clerkUserID).toBe(`clerk_customer_${runKey}`)
      expect(result?.user.roles).toEqual(expect.arrayContaining(['customer']))
      expect(result?.user.portalInviteState).toBe('active')

      if (result?.user?.id) {
        created.push({ collection: 'users', id: result.user.id })
      }
    },
  )
})
