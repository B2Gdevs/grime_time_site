'use client'

import Link from 'next/link'
import { DropletsIcon } from 'lucide-react'

import { ClerkCustomerAccessPanel } from '@/components/auth/ClerkCustomerAccessPanel'
import { Logo } from '@/components/Logo/Logo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from '@/components/ui/sidebar'
import { CUSTOMER_DASHBOARD_PATH } from '@/lib/navigation/portalPaths'
import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import type { MarketingNavLink } from '@/lib/marketing/public-shell'

import { MarketingShellSidebarLink } from './MarketingShellSidebarLink'
import { buildExploreLinks, buildFooterLinks } from './marketingShellNav'

export function MarketingShellSidebar({
  footerLinks,
  pathname,
  primaryLinks,
}: {
  footerLinks: MarketingNavLink[]
  pathname: string
  primaryLinks: MarketingNavLink[]
}) {
  const exploreLinks = buildExploreLinks(primaryLinks)
  const utilityLinks = buildFooterLinks(primaryLinks, footerLinks)

  return (
    <Sidebar collapsible="icon" className="z-30 border-r border-sidebar-border/80 bg-sidebar/92 backdrop-blur-xl">
      <SidebarHeader className="gap-4 border-b border-sidebar-border/80 p-4">
        <Link href="/" className="flex items-center gap-3 rounded-[1.4rem] py-1 transition-colors hover:bg-sidebar-accent/30">
          <Logo className="shadow-none" />
        </Link>
        <div className="group-data-[collapsible=icon]:hidden">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-sidebar-foreground/55">
            North Texas exterior cleaning
          </p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-sidebar-foreground/78">
            The fastest and fairest, and easiest way to get cleaning services
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent className="marketing-sidebar-scroll px-2 py-3">
        <SidebarGroup className="pt-1">
        <div className="group-data-[collapsible=icon]:hidden">
          <ThemeSelector />
        </div>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {exploreLinks.map((item) => (
                <MarketingShellSidebarLink key={`${item.label}-${item.href}`} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 border-t border-sidebar-border/80 p-4">
        <Link
          href="/#instant-quote"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sidebar-primary px-4 py-2.5 text-sm font-semibold text-sidebar-primary-foreground transition hover:opacity-90 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0"
        >
          <DropletsIcon className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:sr-only">Get instant quote</span>
        </Link>

        <div className="rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/35 px-3 py-3 group-data-[collapsible=icon]:hidden">
          <ClerkCustomerAccessPanel
            accountMenuHref={CUSTOMER_DASHBOARD_PATH}
            compact
            showSignUp={false}
            signInFallbackHref={CUSTOMER_DASHBOARD_PATH}
            signUpFallbackHref={CUSTOMER_DASHBOARD_PATH}
          />
        </div>

        {utilityLinks.length > 0 ? (
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs font-medium text-sidebar-foreground/65">
              {utilityLinks.map((item) =>
                item.external ? (
                  <a
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-sidebar-foreground"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    className="transition hover:text-sidebar-foreground"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </div>
          </div>
        ) : null}


      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
