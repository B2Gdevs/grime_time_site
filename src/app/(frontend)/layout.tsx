import type { Metadata } from 'next'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { AdminImpersonationToolbarShell } from '@/components/admin-impersonation/AdminImpersonationToolbarShell'
import { PageMediaDevtoolsProvider } from '@/components/admin-impersonation/PageMediaDevtoolsContext'
import { MarketingShell } from '@/components/frontend/MarketingShell'
import type { Footer, Header } from '@/payload-types'
import { SiteTourProvider } from '@/components/tours/SiteTourProvider'
import { isLocalDevtoolsRequest } from '@/lib/auth/localDevtools'
import { buildMarketingNavLinks } from '@/lib/marketing/public-shell'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const localPageMediaDevtoolsEnabled = await isLocalDevtoolsRequest()
  const [headerData, footerData] = await Promise.all([
    getCachedGlobal('header', 1)(),
    getCachedGlobal('footer', 1)(),
  ])
  const primaryLinks = buildMarketingNavLinks((headerData as Header | null)?.navItems)
  const footerLinks = buildMarketingNavLinks((footerData as Footer | null)?.navItems)

  return (
    <PageMediaDevtoolsProvider>
      <SiteTourProvider>
        <AdminBar
          adminBarProps={{
            preview: isEnabled,
          }}
        />
        <AdminImpersonationToolbarShell pageMediaDevtoolsEnabled={localPageMediaDevtoolsEnabled} />
        <MarketingShell footerLinks={footerLinks} primaryLinks={primaryLinks}>
          {children}
        </MarketingShell>
      </SiteTourProvider>
    </PageMediaDevtoolsProvider>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
}
