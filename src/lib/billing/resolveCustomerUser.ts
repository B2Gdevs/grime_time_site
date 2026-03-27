import type { Payload } from 'payload'

import type { Invoice, ServicePlan, User } from '@/payload-types'

function isUserRecord(value: Invoice['customerUser'] | ServicePlan['customerUser'] | number): value is User {
  return typeof value === 'object' && value !== null && 'email' in value
}

export async function resolveCustomerUser(args: {
  payload: Payload
  user: Invoice['customerUser'] | ServicePlan['customerUser'] | null | number | undefined
}) {
  const { payload, user } = args

  if (!user) {
    return null
  }

  if (isUserRecord(user)) {
    return user
  }

  const resolvedUser = await payload
    .findByID({
      collection: 'users',
      depth: 0,
      id: user,
    })
    .catch(() => null)

  return (resolvedUser as User | null) ?? null
}
