'use client'

import Link from 'next/link'

import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { cn } from '@/utilities/ui'
import type { MarketingNavLink } from '@/lib/marketing/public-shell'

import { MarketingShellLinkIcon } from './MarketingShellLinkIcon'
import { isLinkActive } from './marketingShellNav'

export function MarketingShellSidebarLink({
  item,
  pathname,
  compact = false,
  subtle = false,
}: {
  item: MarketingNavLink
  pathname: string
  compact?: boolean
  subtle?: boolean
}) {
  const icon = <MarketingShellLinkIcon label={item.label} />
  const active = !item.external && isLinkActive(pathname, item.href)
  const className = cn(
    subtle ? 'text-sidebar-foreground/70 hover:text-sidebar-foreground' : '',
    compact ? 'h-9 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.14em]' : '',
    'border border-transparent data-[active=true]:border-sidebar-ring/40',
  )

  if (item.external) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton tooltip={item.label} className={className} asChild>
          <a href={item.href} target="_blank" rel="noreferrer">
            {icon}
            <span>{item.label}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={item.label} isActive={active} className={className} asChild>
        <Link href={item.href}>
          {icon}
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
