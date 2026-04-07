'use client'

import { UserButton } from '@clerk/nextjs'
import { ShieldIcon, UserCircleIcon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

function initialsForName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function NavUser({
  dashboardUrl,
  isRealAdmin,
  staffShell,
  user,
}: {
  dashboardUrl: string
  /** Session is an admin account (used for Payload admin link when on staff routes). */
  isRealAdmin: boolean
  /** User is on /ops or /docs — show staff quick links in the menu. */
  staffShell: boolean
  user: {
    email: string
    name: string
  }
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-3 rounded-lg border border-sidebar-border/80 bg-sidebar-accent/35 px-3 py-2.5">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="rounded-lg">{initialsForName(user.name)}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8',
              },
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Action
                label={staffShell ? 'Ops dashboard' : 'Dashboard'}
                labelIcon={<UserCircleIcon />}
                open={dashboardUrl}
              />
              {isRealAdmin && staffShell ? (
                <UserButton.Action
                  label="Payload admin"
                  labelIcon={<ShieldIcon />}
                  open="/admin"
                />
              ) : null}
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
