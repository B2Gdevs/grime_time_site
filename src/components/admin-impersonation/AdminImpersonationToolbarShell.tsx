import { AdminImpersonationToolbar } from '@/components/admin-impersonation/AdminImpersonationToolbar'
import type { AdminPreviewUser } from '@/components/admin-impersonation/types'
import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'

function toPreviewUser(user: {
  email: string
  id: number | string
  name?: null | string
}): AdminPreviewUser {
  return {
    email: user.email,
    id: user.id,
    name: user.name?.trim() || user.email,
  }
}

export async function AdminImpersonationToolbarShell({
  pageMediaDevtoolsEnabled = false,
}: {
  pageMediaDevtoolsEnabled?: boolean
}) {
  const auth = await getCurrentAuthContext()

  if (!auth.realUser || !auth.isRealAdmin || !auth.effectiveUser) {
    return null
  }

  return (
    <AdminImpersonationToolbar
      effectiveUser={toPreviewUser(auth.effectiveUser)}
      impersonatedUser={auth.impersonatedUser ? toPreviewUser(auth.impersonatedUser) : null}
      localPageMediaEnabled={pageMediaDevtoolsEnabled}
      realUser={toPreviewUser(auth.realUser)}
    />
  )
}
