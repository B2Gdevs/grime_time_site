import type { Access } from 'payload'

import { authEntityId, isAdminUser } from '@/lib/auth/roles'

export const adminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdminUser(user)) return true

  const userId = authEntityId(user)
  if (!userId) return false

  return {
    id: {
      equals: userId,
    },
  }
}
