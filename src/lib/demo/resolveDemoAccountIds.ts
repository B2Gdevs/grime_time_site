import type { Payload } from 'payload'

import type { User } from '@/payload-types'

import { DEMO_EMAIL_SUFFIX } from '@/lib/demo/constants'

/**
 * Accounts linked to any demo portal user (`*@demo.grimetime.local`).
 * Used to scope /ops + CRM when an admin turns demo mode on.
 */
export async function resolveDemoAccountIds(payload: Payload, user: User): Promise<number[]> {
  const result = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 200,
    overrideAccess: false,
    pagination: false,
    sort: 'email',
    user,
    where: {
      email: {
        contains: DEMO_EMAIL_SUFFIX,
      },
    },
  })

  const ids = new Set<number>()
  for (const doc of result.docs) {
    const u = doc as User
    const raw = u.account
    if (typeof raw === 'number') {
      ids.add(raw)
    } else if (raw && typeof raw === 'object' && 'id' in raw && typeof raw.id === 'number') {
      ids.add(raw.id)
    }
  }

  return [...ids].sort((a, b) => a - b)
}
