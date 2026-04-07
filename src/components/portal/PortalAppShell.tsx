import type { ReactNode } from 'react'

import { PageComposerProvider } from '@/components/admin-impersonation/PageComposerContext'
import type { SiteOperatorToolsPanelProps } from '@/components/admin-impersonation/SiteOperatorToolsPanel'
import { PortalCopilot } from '@/components/copilot/PortalCopilot'
import { PortalCopilotProvider } from '@/components/copilot/PortalCopilotContext'
import { PortalCopilotRuntimeProvider } from '@/components/copilot/PortalCopilotRuntimeProvider'
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
  operatorTools?: null | SiteOperatorToolsPanelProps
  pageComposerEnabled?: boolean
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
  operatorTools = null,
  pageComposerEnabled = false,
  quotesEligible,
  user,
}: Props) {
  const shell = (
    <PortalTourGate effectiveUserEmail={effectiveUserEmail} isRealAdmin={isRealAdmin}>
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
          variant="sidebar"
        />
        <SidebarInset className="portal-main-shell min-w-0">{children}</SidebarInset>
      </SidebarProvider>
    </PortalTourGate>
  )
  if (!aiCopilotEnabled) {
    return pageComposerEnabled ? <PageComposerProvider>{shell}</PageComposerProvider> : shell
  }

  const copilotShell = (
    <PortalCopilotProvider>
      <PortalCopilotRuntimeProvider>
        {shell}
        <PortalCopilot operatorTools={operatorTools} />
      </PortalCopilotRuntimeProvider>
    </PortalCopilotProvider>
  )

  return pageComposerEnabled ? <PageComposerProvider>{copilotShell}</PageComposerProvider> : copilotShell
}
