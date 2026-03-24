import type { CSSProperties, ReactNode } from 'react'

import { redirect } from 'next/navigation'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getCurrentPayloadUser, userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { getPortalDocs } from '@/lib/docs/catalog'
import { Providers } from '@/providers'

import '../(frontend)/globals.css'

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentPayloadUser()

  if (!user) {
    redirect('/login')
  }

  const isAdmin = userIsAdmin(user)
  const docs = getPortalDocs({ isAdmin }).map((doc) => ({
    name: doc.title,
    url: `/docs/${doc.slug}`,
  }))

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="site-shell portal-shell overflow-hidden antialiased">
        <Providers>
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
