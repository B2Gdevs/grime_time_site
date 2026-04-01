import type { ReactNode } from 'react'

import { AdminImpersonationToolbarShell } from '@/components/admin-impersonation/AdminImpersonationToolbarShell'
import { PortalCopilot } from '@/components/copilot/PortalCopilot'
import { PortalCopilotProvider } from '@/components/copilot/PortalCopilotContext'
import { AppSidebar } from '@/components/app-sidebar'
import { PortalTourGate } from '@/components/tours/PortalTourGate'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { buildPortalShellStyle } from '@/lib/portal/layout'

type Props = {
  children: ReactNode
  aiCopilotEnabled: boolean
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
  aiCopilotEnabled,
  children,
  documents,
  effectiveUserEmail,
  isRealAdmin,
  quotesEligible,
  user,
}: Props) {
  const shell = (
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

  if (!aiCopilotEnabled) {
    return shell
  }

  return (
    <PortalCopilotProvider>
      {shell}
      <PortalCopilot />
    </PortalCopilotProvider>
  )
}
