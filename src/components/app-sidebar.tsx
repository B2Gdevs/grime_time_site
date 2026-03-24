'use client'

import {
  BookOpenIcon,
  CalendarClockIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
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
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  documents: {
    name: string
    url: string
  }[]
  isAdmin: boolean
  user: {
    email: string
    name: string
  }
}) {
  const dashboardUrl = isAdmin ? '/ops' : '/dashboard'

  const navMain = [
    {
      icon: LayoutDashboardIcon,
      title: isAdmin ? 'Ops dashboard' : 'Dashboard',
      url: dashboardUrl,
    },
    {
      icon: BookOpenIcon,
      title: 'Docs',
      url: '/docs',
    },
    {
      icon: CalendarClockIcon,
      title: 'Schedule',
      url: '/schedule',
    },
  ]

  const navSecondary = [
    {
      icon: FileTextIcon,
      title: 'Marketing site',
      url: '/',
    },
    {
      icon: LifeBuoyIcon,
      title: 'Contact',
      url: '/contact',
    },
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
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser dashboardUrl={dashboardUrl} isAdmin={isAdmin} user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
