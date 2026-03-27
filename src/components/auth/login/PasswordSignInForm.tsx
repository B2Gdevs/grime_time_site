'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { AuthError } from '@/components/auth/auth-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isAdminUser } from '@/lib/auth/roles'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

type Props = {
  nextPath: string
}

function resolvePostLoginPath(payload: unknown, fallbackPath: string): string {
  const user =
    payload &&
    typeof payload === 'object' &&
    'user' in payload &&
    payload.user &&
    typeof payload.user === 'object'
      ? payload.user
      : null

  if (isAdminUser(user)) {
    return fallbackPath === '/dashboard' ? '/ops' : fallbackPath
  }

  return fallbackPath
}

export function PasswordSignInForm({ nextPath }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim().toLowerCase()
    const password = String(form.get('password') || '')

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      const response = await fetch('/api/users/me', { cache: 'no-store' })
      const payload = await response.json().catch(() => null)
      router.push(resolvePostLoginPath(payload, nextPath))
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not sign in. Check your email and password.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2 text-left">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="grid gap-2 text-left">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="login-password">Password</Label>
          <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error ? <AuthError message={error} /> : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}
