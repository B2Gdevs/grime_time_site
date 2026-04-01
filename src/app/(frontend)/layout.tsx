import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'

import { cn } from '@/utilities/ui'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { AdminImpersonationToolbarShell } from '@/components/admin-impersonation/AdminImpersonationToolbarShell'
import { MarketingShell } from '@/components/frontend/MarketingShell'
import type { Footer, Header } from '@/payload-types'
import { SiteTourProvider } from '@/components/tours/SiteTourProvider'
import { buildMarketingNavLinks } from '@/lib/marketing/public-shell'
import { Providers } from '@/providers'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const [headerData, footerData] = await Promise.all([
    getCachedGlobal('header', 1)(),
    getCachedGlobal('footer', 1)(),
  ])
  const primaryLinks = buildMarketingNavLinks((headerData as Header | null)?.navItems)
  const footerLinks = buildMarketingNavLinks((footerData as Footer | null)?.navItems)

  return (
    <html
      className={cn(fontSans.variable, fontMono.variable)}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body className="site-shell antialiased">
        <Providers>
          <SiteTourProvider>
            <AdminBar
              adminBarProps={{
                preview: isEnabled,
              }}
            />
            <AdminImpersonationToolbarShell />
            <MarketingShell footerLinks={footerLinks} primaryLinks={primaryLinks}>
              {children}
            </MarketingShell>
          </SiteTourProvider>
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
}
