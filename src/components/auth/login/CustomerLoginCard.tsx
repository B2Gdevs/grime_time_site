'use client'

import { Show } from '@clerk/nextjs'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'

import { ClerkCustomerAccessPanel } from '@/components/auth/ClerkCustomerAccessPanel'
import { AuthError } from '@/components/auth/auth-error'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PORTAL_ACCESS_DEFAULT_NEXT_PATH } from '@/lib/auth/portal-access/constants'
import {
  isClerkCustomerAuthPrimaryClient,
  isSupabaseCustomerAuthFallbackEnabledClient,
} from '@/lib/auth/customerAuthMode'
import { sanitizeNextPath } from '@/lib/auth/redirect'

const SupabaseCustomerLoginPanel = dynamic(
  () =>
    import('@/components/auth/login/SupabaseCustomerLoginPanel').then((module) => ({
      default: module.SupabaseCustomerLoginPanel,
    })),
  { ssr: false },
)

export function CustomerLoginCard() {
  const search = useSearchParams()
  const nextPath = sanitizeNextPath(search.get('next')) || PORTAL_ACCESS_DEFAULT_NEXT_PATH
  const supabaseConfigured = isSupabaseCustomerAuthFallbackEnabledClient()
  const clerkConfigured = isClerkCustomerAuthPrimaryClient()
  const authLinkError =
    search.get('error') === 'auth-link-invalid'
      ? 'That sign-in or reset link is invalid or expired.'
      : search.get('error') === 'clerk-auth-active'
        ? 'Customer sign-in now runs through the hosted Grime Time auth flow. Start again below with the same email on your account.'
      : search.get('error') === 'supabase-auth-disabled'
        ? 'Customer sign-in is not configured yet.'
        : null

  return (
    <Card className="shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Customer account</CardTitle>
        <CardDescription>
          {clerkConfigured
            ? 'Use the same email tied to your estimate, invoice, or company invite.'
            : 'Sign in with your password or a one-time link.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {authLinkError ? (
          <div className="mb-4">
            <AuthError message={authLinkError} />
          </div>
        ) : null}
        {clerkConfigured ? (
          <div className="grid gap-4">
            <Show when="signed-out">
              <div className="rounded-xl border border-border/70 bg-muted/35 p-4 text-sm text-muted-foreground">
                Use Clerk sign-in for portal access. Choose the same email used on your estimate, invoice,
                or company invite so Grime Time can attach this session to the correct customer record.
              </div>
              <div className="rounded-xl border border-border/70 bg-background p-4 text-sm text-muted-foreground">
                Need access for the first time? Use the secure link from your estimate, invoice, or company
                invite, or open <span className="font-medium text-foreground">/claim-account</span> with the same email.
              </div>
            </Show>
            <ClerkCustomerAccessPanel
              showSignUp={false}
              signInFallbackHref={nextPath}
              signUpFallbackHref={nextPath}
            />
          </div>
        ) : !supabaseConfigured ? (
          <AuthError message="Customer sign-in is not configured yet. Add the Clerk or public Supabase auth env vars first." />
        ) : (
          <SupabaseCustomerLoginPanel nextPath={nextPath} />
        )}
      </CardContent>
    </Card>
  )
}
