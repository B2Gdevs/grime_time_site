import { describe, expect, it, vi } from 'vitest'

import { resolveSharedSectionPermissions } from '@/lib/auth/sharedSectionPermissions'

vi.mock('@/lib/auth/organizationAccess', () => ({
  hasContentAuthoringAccess: vi.fn(),
  hasPayloadAdminAccess: vi.fn(),
}))

describe('shared section permissions', async () => {
  const accessModule = await import('@/lib/auth/organizationAccess')

  it('maps content-authoring users to draft and insert permissions', async () => {
    vi.mocked(accessModule.hasContentAuthoringAccess).mockResolvedValue(true)
    vi.mocked(accessModule.hasPayloadAdminAccess).mockResolvedValue(false)

    await expect(resolveSharedSectionPermissions({} as never, { id: 1 })).resolves.toEqual({
      canCreate: true,
      canEditDraft: true,
      canInsertIntoPage: true,
      canPublish: false,
      canRestoreVersion: false,
      canViewLibrary: true,
    })
  })

  it('maps admin-capable users to publish and restore permissions', async () => {
    vi.mocked(accessModule.hasContentAuthoringAccess).mockResolvedValue(true)
    vi.mocked(accessModule.hasPayloadAdminAccess).mockResolvedValue(true)

    await expect(resolveSharedSectionPermissions({} as never, { id: 2 })).resolves.toEqual({
      canCreate: true,
      canEditDraft: true,
      canInsertIntoPage: true,
      canPublish: true,
      canRestoreVersion: true,
      canViewLibrary: true,
    })
  })
})
