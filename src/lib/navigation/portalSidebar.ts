import type { LucideIcon } from 'lucide-react'
import {
  CalendarClockIcon,
  FileBarChart2Icon,
  FileTextIcon,
  FolderTreeIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShieldIcon,
  UserRoundCogIcon,
  WrenchIcon,
} from 'lucide-react'

import { isPortalPreviewTestUser } from '@/lib/auth/previewIdentity'

export type PortalSidebarItem = {
  icon: LucideIcon
  title: string
  url: string
}

export function buildPortalDashboardUrl({
  isRealAdmin,
  isStaffRoute,
}: {
  isRealAdmin: boolean
  isStaffRoute: boolean
}): string {
  return isRealAdmin && isStaffRoute ? '/ops' : '/dashboard'
}

export function buildCustomerScopeLabel(effectiveUserEmail: string): null | string {
  return isPortalPreviewTestUser({ email: effectiveUserEmail }) ? '(test_user)' : null
}

export function buildPortalMainNav(args: {
  customerScopeLabel: null | string
  isRealAdmin: boolean
  isStaffRoute: boolean
}): PortalSidebarItem[] {
  const { customerScopeLabel, isRealAdmin, isStaffRoute } = args
  const staffShell = isRealAdmin && isStaffRoute

  if (staffShell) {
    return [
      {
        icon: LayoutDashboardIcon,
        title: 'Ops dashboard (admin)',
        url: '/ops',
      },
      {
        icon: ReceiptTextIcon,
        title: 'CRM workspace',
        url: '/ops/crm',
      },
      {
        icon: CalendarClockIcon,
        title: 'Today board',
        url: '/ops/today',
      },
      {
        icon: FileBarChart2Icon,
        title: 'Scorecard',
        url: '/ops/scorecard',
      },
      {
        icon: FolderTreeIcon,
        title: 'Milestones',
        url: '/ops/milestones',
      },
      {
        icon: WrenchIcon,
        title: 'Assets',
        url: '/ops/assets',
      },
      {
        icon: HomeIcon,
        title: customerScopeLabel ? `Customer home ${customerScopeLabel}` : 'Customer home',
        url: '/dashboard',
      },
    ]
  }

  return [
    {
      icon: LayoutDashboardIcon,
      title: customerScopeLabel ? `Dashboard ${customerScopeLabel}` : 'Dashboard',
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
}

export function buildPortalSecondaryNav(args: {
  isRealAdmin: boolean
  isStaffRoute: boolean
  quotesEligible: boolean
}): PortalSidebarItem[] {
  const { isRealAdmin, isStaffRoute, quotesEligible } = args
  const staffShell = isRealAdmin && isStaffRoute

  return [
    {
      icon: LifeBuoyIcon,
      title: 'Contact',
      url: '/contact',
    },
    ...(!staffShell
      ? [
          {
            icon: ReceiptTextIcon,
            title: 'Request quote',
            url: '/#instant-quote',
          },
        ]
      : []),
    ...(staffShell && quotesEligible
      ? [
          {
            icon: ReceiptTextIcon,
            title: 'Quotes',
            url: '/admin/collections/quotes',
          },
        ]
      : []),
    ...(staffShell
      ? [
          {
            icon: Settings2Icon,
            title: 'Quote settings',
            url: '/admin/globals/quoteSettings',
          },
          {
            icon: ShieldIcon,
            title: 'Payload admin',
            url: '/admin',
          },
        ]
      : []),
  ]
}
