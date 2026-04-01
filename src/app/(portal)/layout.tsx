import type { ReactNode } from 'react'

import { redirect } from 'next/navigation'

import { PortalAppShell } from '@/components/portal/PortalAppShell'
import { isAiOpsAssistantEnabled } from '@/lib/ai'
import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { getPortalDocs } from '@/lib/docs/catalog'
import { quotesInternalEnabled } from '@/utilities/quotesAccess'

const portalAdminOnly = process.env.PORTAL_ADMIN_ONLY === 'true'

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const auth = await getCurrentAuthContext()
  const user = auth.effectiveUser

  if (!user) {
    redirect('/login')
  }

  const isAdmin = userIsAdmin(user)

  if (portalAdminOnly && !isAdmin && !auth.isRealAdmin) {
    redirect('/?portal=staff-only')
  }
  const quotesEligible = auth.isRealAdmin && quotesInternalEnabled()
  const docs = auth.isRealAdmin
    ? getPortalDocs({ isAdmin: true }).map((doc) => ({
        name: doc.title,
        url: `/docs/${doc.slug}`,
      }))
    : []

  return (
    <PortalAppShell
      aiCopilotEnabled={auth.isRealAdmin && isAiOpsAssistantEnabled()}
      documents={docs}
      effectiveUserEmail={user.email ?? ''}
      isRealAdmin={auth.isRealAdmin}
      quotesEligible={quotesEligible}
      user={{
        email: user.email,
        name: user.name || user.email,
      }}
    >
      {children}
    </PortalAppShell>
  )
}
