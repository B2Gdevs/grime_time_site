'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'

import { AuthError } from '@/components/auth/auth-error'
import { AuthNotice } from '@/components/auth/AuthNotice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { getClientSideURL } from '@/utilities/getURL'

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setSuccess(null)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim().toLowerCase()

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getClientSideURL()}/auth/confirm?next=/reset-password`,
      })

      if (authError) {
        throw authError
      }

      setSuccess('If that email is in the system, we sent a reset link.')
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not send a reset link right now.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Reset password</CardTitle>
        <CardDescription>Enter your email and we will send a secure reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2 text-left">
            <Label htmlFor="forgot-email">Email</Label>
            <Input id="forgot-email" name="email" type="email" autoComplete="email" required />
          </div>
          {error ? <AuthError message={error} /> : null}
          {success ? <AuthNotice message={success} /> : null}
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? 'Sending reset link...' : 'Send reset link'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
