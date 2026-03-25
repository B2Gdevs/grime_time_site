'use client'

import {
  FileTextIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  CalendarClockIcon,
  ReceiptTextIcon,
  UserRoundCogIcon,
  Settings2Icon,
  ShieldIcon,
} from 'lucide-react'

import { NavDocuments } from '@/components/nav-documents'
import { NavMain } from '@/components/nav-main'
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

export function AppSidebar({
  documents,
  isAdmin,
  quotesEnabled,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  documents: {
    name: string
    url: string
  }[]
  isAdmin: boolean
  quotesEnabled: boolean
  user: {
    email: string
    name: string
  }
}) {
  const dashboardUrl = isAdmin ? '/ops' : '/dashboard'

  const navMain = isAdmin
    ? [
        {
          icon: LayoutDashboardIcon,
          title: 'Ops dashboard',
          url: '/ops',
        },
        {
          icon: HomeIcon,
          title: 'Customer home',
          url: '/dashboard',
        },
      ]
    : [
        {
          icon: LayoutDashboardIcon,
          title: 'Dashboard',
          url: '/dashboard',
        },
        {
          icon: ReceiptTextIcon,
          title: 'Estimates',
          url: '/estimates',
        },
        {
          icon: FileTextIcon,
          title: 'Invoices',
          url: '/invoices',
        },
        {
          icon: CalendarClockIcon,
          title: 'Schedule',
          url: '/service-schedule',
        },
        {
          icon: UserRoundCogIcon,
          title: 'Account',
          url: '/account',
        },
      ]

  const navSecondary = [
    {
      icon: LifeBuoyIcon,
      title: 'Contact',
      url: '/contact',
    },
    ...(!isAdmin
      ? [
          {
            icon: ReceiptTextIcon,
            title: 'Request quote',
            url: '/#instant-quote',
          },
        ]
      : []),
    ...(isAdmin && quotesEnabled
      ? [
          {
            icon: ReceiptTextIcon,
            title: 'Quotes',
            url: '/admin/collections/quotes',
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            icon: Settings2Icon,
            title: 'Quote settings',
            url: '/admin/globals/quoteSettings',
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            icon: ShieldIcon,
            title: 'Payload admin',
            url: '/admin',
          },
        ]
      : []),
  ]

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
        <NavMain items={navMain} />
        {documents.length > 0 ? <NavDocuments items={documents} /> : null}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser dashboardUrl={dashboardUrl} isAdmin={isAdmin} user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
