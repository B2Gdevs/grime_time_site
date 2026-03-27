'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { AuthError } from '@/components/auth/auth-error'
import { AuthNotice } from '@/components/auth/AuthNotice'
import { readErrorMessage } from '@/components/auth/read-error-message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { getClientSideURL } from '@/utilities/getURL'

export function CreateAccountForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setSuccess(null)

    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const email = String(form.get('email') || '').trim().toLowerCase()
    const password = String(form.get('password') || '')

    try {
      const registerResponse = await fetch('/auth/register', {
        body: JSON.stringify({ email, name, password }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!registerResponse.ok && registerResponse.status !== 409) {
        const registerPayload = await registerResponse.json().catch(() => null)
        throw new Error(readErrorMessage(registerPayload, 'Could not create your account profile.'))
      }

      const supabase = getSupabaseBrowserClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${getClientSideURL()}/auth/confirm?next=/dashboard`,
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (data.session) {
        router.push('/dashboard')
        router.refresh()
        return
      }

      setSuccess('Your account is ready. Check your email to finish signing in.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create your account.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2 text-left">
        <Label htmlFor="register-name">Name</Label>
        <Input id="register-name" name="name" autoComplete="name" required />
      </div>
      <div className="grid gap-2 text-left">
        <Label htmlFor="register-email">Email</Label>
        <Input id="register-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="grid gap-2 text-left">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {error ? <AuthError message={error} /> : null}
      {success ? <AuthNotice message={success} /> : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  )
}
