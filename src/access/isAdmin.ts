import type { Access } from 'payload'

import { hasPayloadAdminAccess } from '@/lib/auth/organizationAccess'

export const isAdmin: Access = async ({ req }) => hasPayloadAdminAccess(req.payload, req.user)

