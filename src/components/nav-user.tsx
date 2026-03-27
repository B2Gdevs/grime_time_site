'use client'

import { useRouter } from 'next/navigation'
import { LogOutIcon, ShieldIcon, UserCircleIcon } from 'lucide-react'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
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
  const router = useRouter()
  const { isMobile } = useSidebar()

  async function handleLogout() {
    const supabaseSignOut = (() => {
      try {
        return getSupabaseBrowserClient().auth.signOut()
      } catch {
        return Promise.resolve()
      }
    })()

    await Promise.allSettled([
      fetch('/auth/logout', { method: 'POST' }),
      fetch('/api/users/logout', { method: 'POST' }),
      supabaseSignOut,
    ])
    router.push('/login')
    router.refresh()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{initialsForName(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{initialsForName(user.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <a href={dashboardUrl}>
                  <UserCircleIcon />
                  {staffShell ? 'Ops dashboard' : 'Dashboard'}
                </a>
              </DropdownMenuItem>
              {isRealAdmin && staffShell ? (
                <DropdownMenuItem asChild>
                  <a href="/admin">
                    <ShieldIcon />
                    Payload admin
                  </a>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
