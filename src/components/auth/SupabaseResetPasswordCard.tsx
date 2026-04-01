'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'

import { AuthError } from '@/components/auth/auth-error'
import { AuthNotice } from '@/components/auth/AuthNotice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

export function SupabaseResetPasswordCard() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [ready, setReady] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function checkSession() {
      try {
        const supabase = getSupabaseBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!active) return

        if (!user) {
          setError('This reset link is missing or expired. Request a new one.')
          return
        }

        setReady(true)
      } catch {
        if (active) {
          setError('Could not verify this reset link.')
        }
      }
    }

    void checkSession()

    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setSuccess(null)

    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') || '')
    const confirmPassword = String(form.get('confirmPassword') || '')

    if (password.length < 8) {
      setError('Use at least 8 characters for your new password.')
      setPending(false)
      return
    }

    if (password !== confirmPassword) {
      setError('The password confirmation does not match.')
      setPending(false)
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        throw updateError
      }

      setSuccess('Your password is updated. Redirecting to your dashboard...')
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1000)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not update your password right now.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Choose a new password</CardTitle>
        <CardDescription>Set a new password for your customer account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2 text-left">
            <Label htmlFor="reset-password">New password</Label>
            <Input
              id="reset-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="grid gap-2 text-left">
            <Label htmlFor="reset-password-confirm">Confirm password</Label>
            <Input
              id="reset-password-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          {error ? <AuthError message={error} /> : null}
          {success ? <AuthNotice message={success} /> : null}
          <Button className="w-full" disabled={pending || !ready} type="submit">
            {pending ? 'Updating password...' : 'Update password'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Need a fresh reset link?
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
