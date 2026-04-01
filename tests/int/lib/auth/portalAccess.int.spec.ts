import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { sql } from '@payloadcms/db-postgres'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'
import { completePortalAccessClaim, findPortalAccessPreviewByToken } from '@/lib/auth/portal-access/claims'
import { hashPortalAccessToken } from '@/lib/auth/portal-access/token'
import { loadCompanyAccessSummary } from '@/lib/customers/companyAccess'
import type { User } from '@/payload-types'

const runKey = `portal-access-${Date.now()}`
const created: Array<{ collection: string; id: number | string }> = []

let payload: Payload
let companyUser: User

async function createRecord<T>({
  collection,
  data,
}: {
  collection: 'accounts' | 'users'
  data: Record<string, unknown>
}): Promise<T & { id: number | string }> {
  const doc = (await payload.create({
    collection,
    data,
    overrideAccess: true,
  } as never)) as unknown as T & { id: number | string }

  created.push({ collection, id: doc.id })
  return doc
}

describe('portal access helpers', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await (payload.db as { drizzle: { execute: (statement: ReturnType<typeof sql>) => Promise<unknown> } }).drizzle
      .execute(sql`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clerk_user_i_d" varchar;
        CREATE UNIQUE INDEX IF NOT EXISTS "users_clerk_user_i_d_idx" ON "users" USING btree ("clerk_user_i_d");
      `)

    companyUser = await createRecord<User>({
      collection: 'users',
      data: {
        email: `${runKey}.company@example.com`,
        name: `${runKey} primary`,
        password: 'test-password',
        portalInviteExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        portalInviteState: 'invite_pending',
        portalInviteTokenHash: hashPortalAccessToken(`${runKey}-token`),
        roles: ['customer'],
      },
    })

    const account = await createRecord<{ id: number }>({
      collection: 'accounts',
      data: {
        accountType: 'commercial',
        billingEmail: `${runKey}.company@example.com`,
        customerUser: companyUser.id,
        name: `${runKey} account`,
        status: 'active',
      },
    })

    companyUser = (await payload.update({
      collection: 'users',
      id: companyUser.id,
      data: {
        account: account.id,
        company: `${runKey} account`,
      },
      overrideAccess: true,
    })) as User
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

  it('loads preview data and completes a claim token against the verified email', async () => {
    const preview = await findPortalAccessPreviewByToken(`${runKey}-token`, payload)

    expect(preview?.email).toBe(`${runKey}.company@example.com`)
    expect(preview?.mode).toBe('invite')
    expect(preview?.accountName).toBe(`${runKey} account`)

    const completed = await completePortalAccessClaim({
      clerkUserID: `clerk_${runKey}`,
      payload,
      supabaseAuthUserID: `supabase-${runKey}`,
      token: `${runKey}-token`,
      verifiedEmail: `${runKey}.company@example.com`,
    })

    expect(completed?.clerkUserID).toBe(`clerk_${runKey}`)
    expect(completed?.portalInviteState).toBe('active')
    expect(completed?.supabaseAuthUserID).toBe(`supabase-${runKey}`)
    expect(completed?.portalInviteTokenHash).toBeNull()
  })

  it('loads company access summary with invite authority for the primary company user', async () => {
    const summary = await loadCompanyAccessSummary(companyUser)

    expect(summary?.accountName).toBe(`${runKey} account`)
    expect(summary?.canInvite).toBe(true)
    expect(summary?.members.some((member) => member.email === `${runKey}.company@example.com`)).toBe(
      true,
    )
  })
})
