'use client'

import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SidebarIcon } from 'lucide-react'

import { Logo } from '@/components/Logo/Logo'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import type { MarketingNavLink } from '@/lib/marketing/public-shell'

import { MarketingShellSidebar } from './MarketingShellSidebar'

export type MarketingShellProps = {
  children: ReactNode
  footerLinks: MarketingNavLink[]
  primaryLinks: MarketingNavLink[]
}

export function MarketingShell({ children, footerLinks, primaryLinks }: MarketingShellProps) {
  const pathname = usePathname()

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          '--sidebar-width': '14.5rem',
          '--sidebar-width-icon': '3.25rem',
        } as CSSProperties
      }
    >
      <MarketingShellSidebar footerLinks={footerLinks} pathname={pathname} primaryLinks={primaryLinks} />
      <SidebarInset className="min-h-screen bg-background xl:h-[100dvh] xl:overflow-hidden">
        <div className="flex border-b border-border/80 bg-background/92 px-4 py-4 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
            <Link href="/" className="min-w-0">
              <Logo />
            </Link>
            <SidebarTrigger className="shrink-0 border border-border/80 bg-card/80 text-foreground hover:bg-muted">
              <SidebarIcon className="size-4" />
            </SidebarTrigger>
          </div>
        </div>

        <div className="flex min-h-screen min-w-0 xl:h-full xl:overflow-hidden">
          <main className="marketing-shell-main marketing-main-scroll flex-1 w-full min-h-screen min-w-0 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain bg-[radial-gradient(circle_at_top,rgba(142,219,62,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,252,0.92))] dark:bg-[radial-gradient(circle_at_top,rgba(142,219,62,0.14),transparent_26%),linear-gradient(180deg,rgba(3,10,17,0.98),rgba(7,19,33,0.96))]">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
