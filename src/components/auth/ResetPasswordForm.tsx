'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

import { ClerkCustomerAccessPanel } from '@/components/auth/ClerkCustomerAccessPanel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isClerkClientConfigured } from '@/lib/clerk/config'

const SupabaseResetPasswordCard = dynamic(
  () =>
    import('@/components/auth/SupabaseResetPasswordCard').then((module) => ({
      default: module.SupabaseResetPasswordCard,
    })),
  { ssr: false },
)

export function ResetPasswordForm() {
  const clerkConfigured = isClerkClientConfigured()

  if (clerkConfigured) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Finish password reset</CardTitle>
          <CardDescription>
            Customer password resets now run through the hosted Grime Time sign-in flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-xl border border-border/70 bg-muted/35 p-4 text-sm text-muted-foreground">
            If you opened an older reset link, start a fresh sign-in instead and complete password
            recovery there with the same customer email.
          </div>
          <ClerkCustomerAccessPanel showSignUp={false} signInFallbackHref="/dashboard" />
          <div className="text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              Need help finding the right email?
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <SupabaseResetPasswordCard />
}
