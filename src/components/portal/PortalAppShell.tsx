import type { ReactNode } from 'react'

import { AdminImpersonationToolbarShell } from '@/components/admin-impersonation/AdminImpersonationToolbarShell'
import { AppSidebar } from '@/components/app-sidebar'
import { PortalTourGate } from '@/components/tours/PortalTourGate'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { buildPortalShellStyle } from '@/lib/portal/layout'

type Props = {
  children: ReactNode
  documents: {
    name: string
    url: string
  }[]
  effectiveUserEmail: string
  isRealAdmin: boolean
  quotesEligible: boolean
  user: {
    email: string
    name: string
  }
}

export function PortalAppShell({
  children,
  documents,
  effectiveUserEmail,
  isRealAdmin,
  quotesEligible,
  user,
}: Props) {
  return (
    <PortalTourGate effectiveUserEmail={effectiveUserEmail} isRealAdmin={isRealAdmin}>
      <AdminImpersonationToolbarShell />
      <SidebarProvider
        className="portal-shell flex min-h-screen w-full"
        style={buildPortalShellStyle()}
      >
        <AppSidebar
          documents={documents}
          effectiveUserEmail={effectiveUserEmail}
          isRealAdmin={isRealAdmin}
          quotesEligible={quotesEligible}
          user={user}
          variant="inset"
        />
        <SidebarInset className="portal-main-shell min-w-0">{children}</SidebarInset>
      </SidebarProvider>
    </PortalTourGate>
  )
}
