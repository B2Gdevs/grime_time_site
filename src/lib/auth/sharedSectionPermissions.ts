import type { Access, Payload } from 'payload'

import { hasContentAuthoringAccess, hasPayloadAdminAccess } from '@/lib/auth/organizationAccess'
import type { RoleCarrier } from '@/lib/auth/roles'

export interface SharedSectionPermissions {
  canCreate: boolean
  canEditDraft: boolean
  canInsertIntoPage: boolean
  canPublish: boolean
  canRestoreVersion: boolean
  canViewLibrary: boolean
}

export async function resolveSharedSectionPermissions(
  payload: Payload,
  user: RoleCarrier,
): Promise<SharedSectionPermissions> {
  const canAuthor = await hasContentAuthoringAccess(payload, user)
  const canAdminister = await hasPayloadAdminAccess(payload, user)

  return {
    canCreate: canAuthor,
    canEditDraft: canAuthor,
    canInsertIntoPage: canAuthor,
    canPublish: canAdminister,
    canRestoreVersion: canAdminister,
    canViewLibrary: canAuthor,
  }
}

export const canViewSharedSectionLibrary: Access = async ({ req }) =>
  (await resolveSharedSectionPermissions(req.payload, req.user)).canViewLibrary

export const canEditSharedSectionDrafts: Access = async ({ req }) =>
  (await resolveSharedSectionPermissions(req.payload, req.user)).canEditDraft

export const canDeleteSharedSections: Access = async ({ req }) =>
  (await resolveSharedSectionPermissions(req.payload, req.user)).canPublish

