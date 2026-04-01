import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter, JetBrains_Mono } from 'next/font/google'

import { Providers } from '@/providers'
import { cn } from '@/utilities/ui'

import './(frontend)/globals.css'

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  icons: {
    icon: [
      { rel: 'icon', url: '/favicon.ico', sizes: '32x32' },
      { rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={cn(fontSans.variable, fontMono.variable)}
      lang="en"
      suppressHydrationWarning
    >
      <body className="site-shell antialiased">
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
