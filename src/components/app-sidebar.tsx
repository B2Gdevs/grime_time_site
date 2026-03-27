'use client'

import { Suspense } from 'react'

import { NavDocuments } from '@/components/nav-documents'
import { NavMain } from '@/components/nav-main'
import { TourLauncher } from '@/components/tours/TourLauncher'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { usePortalStaffRoute } from '@/lib/auth/portalNavSurface'
import {
  buildCustomerScopeLabel,
  buildPortalDashboardUrl,
  buildPortalMainNav,
  buildPortalSecondaryNav,
} from '@/lib/navigation/portalSidebar'

export function AppSidebar({
  documents,
  effectiveUserEmail,
  isRealAdmin,
  quotesEligible,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  documents: {
    name: string
    url: string
  }[]
  /** Logged-in user email (effective user, including impersonation). */
  effectiveUserEmail: string
  /** True when the authenticated account has admin privileges (real session, not effective role). */
  isRealAdmin: boolean
  /** Show internal Quotes shortcut when staff chrome is active and env allows. */
  quotesEligible: boolean
  user: {
    email: string
    name: string
  }
}) {
  const isStaffRoute = usePortalStaffRoute()
  const staffShell = isRealAdmin && isStaffRoute

  const customerScopeLabel = buildCustomerScopeLabel(effectiveUserEmail)
  const dashboardUrl = buildPortalDashboardUrl({
    isRealAdmin,
    isStaffRoute,
  })
  const navMain = buildPortalMainNav({
    customerScopeLabel,
    isRealAdmin,
    isStaffRoute,
  })

  const staffDocs = staffShell ? documents : []

  const navSecondary = buildPortalSecondaryNav({
    isRealAdmin,
    isStaffRoute,
    quotesEligible,
  })

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href={dashboardUrl}>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                  GT
                </div>
                <span className="text-base font-semibold">Grime Time</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="portal-nav-scroll" data-portal-nav-scroll="">
        <div className="px-2 pt-2">
          <Suspense fallback={<div className="h-9" aria-hidden />}>
            <TourLauncher isRealAdmin={isRealAdmin} />
          </Suspense>
        </div>
        <NavMain items={navMain} />
        {staffDocs.length > 0 ? <NavDocuments items={staffDocs} /> : null}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser dashboardUrl={dashboardUrl} isRealAdmin={isRealAdmin} staffShell={staffShell} user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
