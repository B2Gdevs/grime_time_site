'use client'

import Link from 'next/link'
import { FileTextIcon, type LucideIcon } from 'lucide-react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavDocuments({
  items,
}: {
  items: {
    icon?: LucideIcon
    name: string
    url: string
  }[]
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Docs</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon ?? FileTextIcon

            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild tooltip={item.name}>
                  <Link href={item.url}>
                    <Icon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

