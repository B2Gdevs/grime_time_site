import type { Metadata } from 'next'
import React from 'react'

import { AdminImpersonationToolbarShell } from '@/components/admin-impersonation/AdminImpersonationToolbarShell'
import { ContentAuthoringToolbar } from '@/components/admin-impersonation/ContentAuthoringToolbar'
import { PageComposerDrawer } from '@/components/admin-impersonation/PageComposerDrawer'
import { PageComposerHomeAutoOpen } from '@/components/admin-impersonation/PageComposerHomeAutoOpen'
import { PageComposerProvider } from '@/components/admin-impersonation/PageComposerContext'
import { VercelAnalytics } from '@/components/analytics/VercelAnalytics'
import { PageMediaDevtoolsProvider } from '@/components/admin-impersonation/PageMediaDevtoolsContext'
import { PortalCopilot } from '@/components/copilot/PortalCopilot'
import { PortalCopilotProvider } from '@/components/copilot/PortalCopilotContext'
import { PortalCopilotRuntimeProvider } from '@/components/copilot/PortalCopilotRuntimeProvider'
import { MarketingShell } from '@/components/frontend/MarketingShell'
import { isAiOpsAssistantEnabled } from '@/lib/ai'
import { hasContentAuthoringAccess } from '@/lib/auth/organizationAccess'
import type { AdminPreviewUser } from '@/components/admin-impersonation/types'
import type { Footer, Header } from '@/payload-types'
import { SiteTourProvider } from '@/components/tours/SiteTourProvider'
import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { isLocalDevtoolsRequest } from '@/lib/auth/localDevtools'
import { buildMarketingNavLinks } from '@/lib/marketing/public-shell'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'
import { getServerSideURL } from '@/utilities/getURL'

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await draftMode()
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
  const frontendOperatorTools =
    aiCopilotEnabled && auth.realUser && auth.isRealAdmin && auth.effectiveUser
      ? {
          effectiveUser: toPreviewUser(auth.effectiveUser),
          impersonatedUser: auth.impersonatedUser ? toPreviewUser(auth.impersonatedUser) : null,
          localPageMediaEnabled: canUseLocalPageMediaDevtools,
          realUser: toPreviewUser(auth.realUser),
        }
      : null

  const shellContent = (
    <>
      <PageMediaDevtoolsProvider enabled={canUseLocalPageMediaDevtools}>
        <SiteTourProvider>
          {!aiCopilotEnabled && auth.isRealAdmin ? (
            <AdminImpersonationToolbarShell pageMediaDevtoolsEnabled={canUseLocalPageMediaDevtools} />
          ) : !aiCopilotEnabled && canUseContentAuthoring ? (
            <ContentAuthoringToolbar />
          ) : null}
          <MarketingShell
            footerLinks={footerLinks}
            primaryLinks={primaryLinks}
          >
            {children}
          </MarketingShell>
          {pageComposerEnabled ? <PageComposerHomeAutoOpen enabled={auth.isRealAdmin} /> : null}
          {!aiCopilotEnabled ? <PageComposerDrawer enabled={pageComposerEnabled} /> : null}
        </SiteTourProvider>
      </PageMediaDevtoolsProvider>
      <VercelAnalytics />
    </>
  )

  const shell = shellContent

  if (!aiCopilotEnabled) {
    return pageComposerEnabled ? <PageComposerProvider>{shell}</PageComposerProvider> : shell
  }

  const copilotShell = (
    <PortalCopilotProvider>
      <PortalCopilotRuntimeProvider>
        {shell}
        <PortalCopilot operatorTools={frontendOperatorTools} />
      </PortalCopilotRuntimeProvider>
    </PortalCopilotProvider>
  )

  return pageComposerEnabled ? <PageComposerProvider>{copilotShell}</PageComposerProvider> : copilotShell
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
}
