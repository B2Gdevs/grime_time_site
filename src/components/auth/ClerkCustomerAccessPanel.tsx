'use client'

import Link from 'next/link'
import { Show, SignInButton, SignUpButton, useClerk, useUser } from '@clerk/nextjs'
import { ChevronsUpDown, LogOutIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/utilities/ui'

type ClerkCustomerAccessPanelProps = {
  compact?: boolean
  showSignUp?: boolean
  signInFallbackHref?: string
  signUpFallbackHref?: string
  /** Shown in the account menu (e.g. customer dashboard). */
  accountMenuHref?: string
  accountMenuLabel?: string
}

function signedInDisplayName(
  user: {
    firstName: null | string
    fullName: null | string
    lastName: null | string
    username: null | string
  },
  email: string,
) {
  const full = user.fullName?.trim()
  if (full) return full
  const firstLast = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  if (firstLast) return firstLast
  if (user.username?.trim()) return user.username.trim()
  const local = email.split('@')[0]
  return local || 'Account'
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase()
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase()
  }
  return parts[0]?.charAt(0)?.toUpperCase() || '?'
}

function SignedInAccountTrigger({
  accountMenuHref,
  accountMenuLabel,
  displayName,
  email,
  imageUrl,
  isLoaded,
}: {
  accountMenuHref?: string
  accountMenuLabel?: string
  displayName: string
  email: string
  imageUrl: null | string
  isLoaded: boolean
}) {
  const { signOut } = useClerk()
  const initials = initialsFromName(displayName || email || 'U')

  if (!isLoaded) {
    return (
      <div className="flex w-full min-w-0 items-center gap-2 rounded-lg p-2">
        <div className="size-8 shrink-0 animate-pulse rounded-md bg-sidebar-foreground/10" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-3.5 w-[55%] animate-pulse rounded bg-sidebar-foreground/10" />
          <div className="h-3 w-[75%] animate-pulse rounded bg-sidebar-foreground/10" />
        </div>
        <div className="size-4 shrink-0" />
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            'flex w-full min-w-0 max-w-full items-center gap-2 rounded-lg p-2 text-left outline-none',
            'transition-colors hover:bg-sidebar-accent/40 focus-visible:ring-2 focus-visible:ring-sidebar-ring/40',
          )}
        >
          <span className="relative size-8 shrink-0 overflow-hidden rounded-md bg-sidebar-accent ring-1 ring-sidebar-border/60">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Clerk-hosted avatar URL
              <img src={imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-xs font-semibold text-sidebar-foreground">
                {initials}
              </span>
            )}
          </span>
          <span className="grid min-w-0 flex-1 gap-0.5 text-left leading-tight">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">{displayName || '…'}</span>
            <span className="truncate text-xs text-sidebar-foreground/65" title={email || undefined}>
              {email || '…'}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/55" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[min(100vw-2rem,20rem)]"
      >
        {accountMenuHref ? (
          <>
            <DropdownMenuItem asChild>
              <Link href={accountMenuHref}>{accountMenuLabel ?? 'Dashboard'}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem
          className="gap-2 text-destructive focus:text-destructive"
          onSelect={(event) => {
            event.preventDefault()
            void signOut()
          }}
        >
          <LogOutIcon className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ClerkCustomerAccessPanel({
  compact = false,
  showSignUp = true,
  signInFallbackHref = '/login',
  signUpFallbackHref = '/login',
  accountMenuHref,
  accountMenuLabel = 'Dashboard',
}: ClerkCustomerAccessPanelProps) {
  const { isLoaded, user } = useUser()
  const email =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? ''
  const displayName = user ? signedInDisplayName(user, email) : ''
  const imageUrl = user?.imageUrl ?? null

  return (
    <div className={cn('w-full min-w-0 max-w-full', compact ? 'grid gap-2' : 'grid gap-3')}>
      <Show when="signed-out">
        <div className={cn('grid', compact ? 'gap-2' : 'gap-3')}>
          <SignInButton fallbackRedirectUrl={signInFallbackHref} mode="modal">
            <Button className="w-full">Sign in</Button>
          </SignInButton>
          {showSignUp ? (
            <SignUpButton fallbackRedirectUrl={signUpFallbackHref} mode="modal">
              <Button className="w-full" variant="outline">
                Create account
              </Button>
            </SignUpButton>
          ) : null}
        </div>
      </Show>

      <Show when="signed-in">
        <div className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-sidebar-border/60 bg-sidebar/35 p-0.5">
          <SignedInAccountTrigger
            accountMenuHref={accountMenuHref}
            accountMenuLabel={accountMenuLabel}
            displayName={displayName}
            email={email}
            imageUrl={imageUrl}
            isLoaded={isLoaded}
          />
        </div>
      </Show>
    </div>
  )
}
