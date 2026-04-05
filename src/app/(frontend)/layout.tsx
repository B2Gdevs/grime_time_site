import type { Metadata } from 'next'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { AdminImpersonationToolbarShell } from '@/components/admin-impersonation/AdminImpersonationToolbarShell'
import { ContentAuthoringToolbar } from '@/components/admin-impersonation/ContentAuthoringToolbar'
import { PageComposerProvider } from '@/components/admin-impersonation/PageComposerContext'
import { VercelAnalytics } from '@/components/analytics/VercelAnalytics'
import { PageMediaDevtoolsProvider } from '@/components/admin-impersonation/PageMediaDevtoolsContext'
import { PortalCopilot } from '@/components/copilot/PortalCopilot'
import { PortalCopilotProvider } from '@/components/copilot/PortalCopilotContext'
import { MarketingShell } from '@/components/frontend/MarketingShell'
import { isAiOpsAssistantEnabled } from '@/lib/ai'
import { hasContentAuthoringAccess } from '@/lib/auth/organizationAccess'
import type { Footer, Header } from '@/payload-types'
import { SiteTourProvider } from '@/components/tours/SiteTourProvider'
import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { isLocalDevtoolsRequest } from '@/lib/auth/localDevtools'
import { buildMarketingNavLinks } from '@/lib/marketing/public-shell'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const localPageMediaDevtoolsEnabled = await isLocalDevtoolsRequest()
  const auth = await getCurrentAuthContext()
  const canUseContentAuthoring =
    auth.realUser ? await hasContentAuthoringAccess(auth.payload, auth.realUser) : false
  const pageComposerEnabled = auth.isRealAdmin || canUseContentAuthoring
  const canUseLocalPageMediaDevtools = localPageMediaDevtoolsEnabled && auth.isRealAdmin
  const aiCopilotEnabled = pageComposerEnabled && isAiOpsAssistantEnabled()
  const [headerData, footerData] = await Promise.all([
    getCachedGlobal('header', 1)(),
    getCachedGlobal('footer', 1)(),
  ])
  const primaryLinks = buildMarketingNavLinks((headerData as Header | null)?.navItems)
  const footerLinks = buildMarketingNavLinks((footerData as Footer | null)?.navItems)

  const shellContent = (
    <>
      <PageMediaDevtoolsProvider enabled={canUseLocalPageMediaDevtools}>
        <SiteTourProvider>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />
          {auth.isRealAdmin ? (
            <AdminImpersonationToolbarShell pageMediaDevtoolsEnabled={canUseLocalPageMediaDevtools} />
          ) : canUseContentAuthoring ? (
            <ContentAuthoringToolbar />
          ) : null}
          <MarketingShell
            footerLinks={footerLinks}
            pageComposerEnabled={pageComposerEnabled}
            primaryLinks={primaryLinks}
          >
            {children}
          </MarketingShell>
        </SiteTourProvider>
      </PageMediaDevtoolsProvider>
      <VercelAnalytics />
    </>
  )

  const shell = pageComposerEnabled ? (
    <PageComposerProvider>{shellContent}</PageComposerProvider>
  ) : (
    shellContent
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

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
}
