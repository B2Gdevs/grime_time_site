import type { Access } from 'payload'

import { isAdminUser } from '@/lib/auth/roles'

export const isAdmin: Access = ({ req: { user } }) => isAdminUser(user)

