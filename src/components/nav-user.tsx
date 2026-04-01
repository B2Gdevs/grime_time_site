'use client'

import { useClerk } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOutIcon, ShieldIcon, UserCircleIcon } from 'lucide-react'

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
import { isSupabaseCustomerAuthFallbackEnabledClient } from '@/lib/auth/customerAuthMode'

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
  const clerk = useClerk()

  async function handleLogout() {
    const clerkSignOut = clerk.signOut({ redirectUrl: '/login' }).catch(() => undefined)
    const supabaseSignOut = isSupabaseCustomerAuthFallbackEnabledClient()
      ? import('@/lib/supabase/browser')
          .then(({ getSupabaseBrowserClient }) => getSupabaseBrowserClient().auth.signOut())
          .catch(() => undefined)
      : Promise.resolve(undefined)
    const legacyLogout = isSupabaseCustomerAuthFallbackEnabledClient()
      ? fetch('/auth/logout', { method: 'POST' })
      : Promise.resolve(undefined)

    await Promise.allSettled([
      legacyLogout,
      fetch('/api/users/logout', { method: 'POST' }),
      supabaseSignOut,
      clerkSignOut,
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
                <Link href={dashboardUrl}>
                  <UserCircleIcon />
                  {staffShell ? 'Ops dashboard' : 'Dashboard'}
                </Link>
              </DropdownMenuItem>
              {isRealAdmin && staffShell ? (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <ShieldIcon />
                    Payload admin
                  </Link>
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
