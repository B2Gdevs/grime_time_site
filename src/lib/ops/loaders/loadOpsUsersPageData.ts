import type { User, OrganizationMembership } from '@/payload-types'

import { buildOpsUsersPageData } from '@/lib/ops/loaders/opsAdminData'
import { loadOpsAdminContext } from '@/lib/ops/loaders/loadOpsAdminContext'

export async function loadOpsUsersPageData() {
  const { payload } = await loadOpsAdminContext()

  const [usersResult, membershipsResult] = await Promise.all([
    payload.find({
      collection: 'users',
      depth: 1,
      limit: 200,
      overrideAccess: true,
      pagination: false,
      sort: 'name',
    }),
    payload.find({
      collection: 'organization-memberships',
      depth: 2,
      limit: 500,
      overrideAccess: true,
      pagination: false,
      sort: 'updatedAt',
    }),
  ])

  return buildOpsUsersPageData({
    memberships: membershipsResult.docs as OrganizationMembership[],
    users: usersResult.docs as User[],
  })
}
