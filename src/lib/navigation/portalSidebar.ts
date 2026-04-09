import type { LucideIcon } from 'lucide-react'
import {
  Building2Icon,
  CalendarClockIcon,
  FileTextIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShieldIcon,
  UserRoundCogIcon,
  UsersIcon,
} from 'lucide-react'

import { isPortalPreviewTestUser } from '@/lib/auth/previewIdentity'
import {
  CUSTOMER_DASHBOARD_PATH,
  OPS_CUSTOMERS_PATH,
  OPS_DASHBOARD_PATH,
  OPS_USERS_PATH,
} from '@/lib/navigation/portalPaths'

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
  return isRealAdmin && isStaffRoute ? OPS_DASHBOARD_PATH : CUSTOMER_DASHBOARD_PATH
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
        title: 'Ops dashboard',
        url: OPS_DASHBOARD_PATH,
      },
      {
        icon: ReceiptTextIcon,
        title: 'Ops workspace',
        url: '/ops/workspace',
      },
      {
        icon: UsersIcon,
        title: 'Users',
        url: OPS_USERS_PATH,
      },
      {
        icon: Building2Icon,
        title: 'Customers',
        url: OPS_CUSTOMERS_PATH,
      },
    ]
  }

  return [
    {
      icon: LayoutDashboardIcon,
      title: customerScopeLabel ? `Dashboard ${customerScopeLabel}` : 'Dashboard',
      url: CUSTOMER_DASHBOARD_PATH,
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
            icon: HomeIcon,
            title: 'Public site',
            url: '/',
          },
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
