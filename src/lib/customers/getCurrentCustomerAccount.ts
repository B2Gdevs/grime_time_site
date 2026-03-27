import type { Payload } from 'payload'

import type { Account, User } from '@/payload-types'

export async function getCurrentCustomerAccount(args: {
  payload: Payload
  user: User
}): Promise<Account | null> {
  const { payload, user } = args

  if (!user.account) {
    return null
  }

  const accountID = typeof user.account === 'object' ? user.account.id : user.account

  const account = await payload
    .findByID({
      collection: 'accounts',
      depth: 0,
      id: accountID,
    })
    .catch(() => null)

  return (account as Account | null) ?? null
}
