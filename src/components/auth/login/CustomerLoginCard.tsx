'use client'

import { useSearchParams } from 'next/navigation'

import { AuthError } from '@/components/auth/auth-error'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateAccountForm } from '@/components/auth/login/CreateAccountForm'
import { MagicLinkSignInForm } from '@/components/auth/login/MagicLinkSignInForm'
import { PasswordSignInForm } from '@/components/auth/login/PasswordSignInForm'
import { PORTAL_ACCESS_DEFAULT_NEXT_PATH } from '@/lib/auth/portal-access/constants'
import { sanitizeNextPath } from '@/lib/auth/redirect'
import { isSupabaseAuthConfigured } from '@/lib/supabase/config'

export function CustomerLoginCard() {
  const search = useSearchParams()
  const nextPath = sanitizeNextPath(search.get('next')) || PORTAL_ACCESS_DEFAULT_NEXT_PATH
  const supabaseConfigured = isSupabaseAuthConfigured()
  const authLinkError =
    search.get('error') === 'auth-link-invalid'
      ? 'That sign-in or reset link is invalid or expired.'
      : search.get('error') === 'supabase-auth-disabled'
        ? 'Customer sign-in is not configured yet.'
        : null

  return (
    <Card className="shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Customer account</CardTitle>
        <CardDescription>Sign in with your password or a one-time link.</CardDescription>
      </CardHeader>
      <CardContent>
        {authLinkError ? (
          <div className="mb-4">
            <AuthError message={authLinkError} />
          </div>
        ) : null}
        {!supabaseConfigured ? (
          <AuthError message="Customer sign-in is not configured yet. Add the public Supabase auth env vars first." />
        ) : (
          <Tabs defaultValue="sign-in" className="grid gap-6">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl p-1">
              <TabsTrigger value="sign-in">Password</TabsTrigger>
              <TabsTrigger value="magic-link">Magic link</TabsTrigger>
              <TabsTrigger value="create-account">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="sign-in">
              <PasswordSignInForm nextPath={nextPath} />
            </TabsContent>
            <TabsContent value="magic-link">
              <MagicLinkSignInForm nextPath={nextPath} />
            </TabsContent>
            <TabsContent value="create-account">
              <CreateAccountForm />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
