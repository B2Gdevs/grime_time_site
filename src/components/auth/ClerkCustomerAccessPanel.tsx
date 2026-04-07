'use client'

import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

import { Button } from '@/components/ui/button'

type ClerkCustomerAccessPanelProps = {
  compact?: boolean
  showSignUp?: boolean
  signInFallbackHref?: string
  signUpFallbackHref?: string
}

export function ClerkCustomerAccessPanel({
  compact = false,
  showSignUp = true,
  signInFallbackHref = '/login',
  signUpFallbackHref = '/login',
}: ClerkCustomerAccessPanelProps) {
  return (
    <div className={compact ? 'grid gap-2' : 'grid gap-3'}>
      <Show when="signed-out">
        <div className={compact ? 'grid gap-2' : 'grid gap-3'}>
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
        <div className={compact ? 'flex items-center gap-3' : 'flex items-center justify-between gap-3'}>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Signed in</p>
            <p className="text-xs text-muted-foreground">Open your account and continue with the same Clerk session.</p>
          </div>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-9 w-9',
              },
            }}
          />
        </div>
      </Show>
    </div>
  )
}
