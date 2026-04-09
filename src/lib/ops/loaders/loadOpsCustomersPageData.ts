import type { Account, User } from '@/payload-types'

import { buildOpsCustomersPageData } from '@/lib/ops/loaders/opsAdminData'
import { loadOpsAdminContext } from '@/lib/ops/loaders/loadOpsAdminContext'

export async function loadOpsCustomersPageData() {
  const { payload } = await loadOpsAdminContext()

  const [accountsResult, usersResult] = await Promise.all([
    payload.find({
      collection: 'accounts',
      depth: 1,
      limit: 200,
      overrideAccess: true,
      pagination: false,
      sort: 'name',
    }),
    payload.find({
      collection: 'users',
      depth: 1,
      limit: 300,
      overrideAccess: true,
      pagination: false,
      sort: 'email',
    }),
  ])

  return buildOpsCustomersPageData({
    accounts: accountsResult.docs as Account[],
    users: usersResult.docs as User[],
  })
}
