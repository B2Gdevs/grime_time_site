'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

import { ClerkCustomerAccessPanel } from '@/components/auth/ClerkCustomerAccessPanel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isClerkClientConfigured } from '@/lib/clerk/config'

const SupabaseForgotPasswordCard = dynamic(
  () =>
    import('@/components/auth/SupabaseForgotPasswordCard').then((module) => ({
      default: module.SupabaseForgotPasswordCard,
    })),
  { ssr: false },
)

export function ForgotPasswordForm() {
  const clerkConfigured = isClerkClientConfigured()

  if (clerkConfigured) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset access</CardTitle>
          <CardDescription>
            Open hosted sign-in and use the same email already tied to your customer account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-xl border border-border/70 bg-muted/35 p-4 text-sm text-muted-foreground">
            Clerk handles password recovery for the customer portal now. Start sign-in with the same
            email on your estimate, invoice, or company invite, then follow the reset steps there.
          </div>
          <ClerkCustomerAccessPanel showSignUp={false} signInFallbackHref="/dashboard" />
          <div className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <SupabaseForgotPasswordCard />
}
