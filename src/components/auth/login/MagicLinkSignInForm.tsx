'use client'

import { useState, type FormEvent } from 'react'

import { AuthError } from '@/components/auth/auth-error'
import { AuthNotice } from '@/components/auth/AuthNotice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { getClientSideURL } from '@/utilities/getURL'

type Props = {
  nextPath: string
}

export function MagicLinkSignInForm({ nextPath }: Props) {
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
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getClientSideURL()}/auth/confirm?next=${encodeURIComponent(nextPath)}`,
          shouldCreateUser: false,
        },
      })

      if (authError) {
        throw authError
      }

      setSuccess('Check your email for a secure sign-in link.')
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Could not send a sign-in link.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2 text-left">
        <Label htmlFor="magic-email">Email</Label>
        <Input id="magic-email" name="email" type="email" autoComplete="email" required />
      </div>
      {error ? <AuthError message={error} /> : null}
      {success ? <AuthNotice message={success} /> : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? 'Sending sign-in link...' : 'Email me a sign-in link'}
      </Button>
    </form>
  )
}
