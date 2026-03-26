import type { CSSProperties, ReactNode } from 'react'

import { redirect } from 'next/navigation'

import { AdminImpersonationToolbarShell } from '@/components/admin-impersonation/AdminImpersonationToolbarShell'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { getPortalDocs } from '@/lib/docs/catalog'
import { Providers } from '@/providers'
import { quotesInternalEnabled } from '@/utilities/quotesAccess'

import '../(frontend)/globals.css'

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
  const quotesEnabled = isAdmin && quotesInternalEnabled()
  const docs = isAdmin
    ? getPortalDocs({ isAdmin }).map((doc) => ({
        name: doc.title,
        url: `/docs/${doc.slug}`,
      }))
    : []

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="site-shell portal-shell overflow-hidden antialiased">
        <Providers>
          <AdminImpersonationToolbarShell />
          <SidebarProvider
            className="portal-shell"
            style={
              {
                '--header-height': 'calc(var(--spacing) * 12)',
                '--sidebar-width': 'calc(var(--spacing) * 72)',
              } as CSSProperties
            }
          >
            <AppSidebar
              documents={docs}
              isAdmin={isAdmin}
              quotesEnabled={quotesEnabled}
              user={{
                email: user.email,
                name: user.name || user.email,
              }}
              variant="inset"
            />
            <SidebarInset className="portal-main-shell">{children}</SidebarInset>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  )
}
