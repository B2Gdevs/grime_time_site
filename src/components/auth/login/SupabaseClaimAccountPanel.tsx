'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { AuthError } from '@/components/auth/auth-error'
import { AuthNotice } from '@/components/auth/AuthNotice'
import type { ClaimPreview } from '@/components/auth/login/ClaimAccountForm'
import { readErrorMessage } from '@/components/auth/read-error-message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { getClientSideURL } from '@/utilities/getURL'

type Props = {
  claimToken: string
  nextPath: string
  preview: ClaimPreview
}

function buildConfirmURL(args: { claimToken: string; nextPath: string }) {
  const url = new URL('/auth/confirm', getClientSideURL())
  url.searchParams.set('claim', args.claimToken)
  url.searchParams.set('next', args.nextPath)
  return url.toString()
}

export function SupabaseClaimAccountPanel({ claimToken, nextPath, preview }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleMagicClaim() {
    setPending(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: preview.email,
        options: {
          emailRedirectTo: buildConfirmURL({ claimToken, nextPath }),
          shouldCreateUser: true,
        },
      })

      if (authError) {
        throw authError
      }

      setSuccess('Check your email for a secure account-claim link.')
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Could not send your account-claim link.',
      )
    } finally {
      setPending(false)
    }
  }

  async function handlePasswordClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setSuccess(null)

    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const password = String(form.get('password') || '')

    try {
      const registerResponse = await fetch('/auth/register', {
        body: JSON.stringify({
          email: preview.email,
          name: name || preview.name || preview.email,
          password,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!registerResponse.ok && registerResponse.status !== 409) {
        const registerPayload = await registerResponse.json().catch(() => null)
        throw new Error(readErrorMessage(registerPayload, 'Could not prepare your customer account.'))
      }

      const supabase = getSupabaseBrowserClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: preview.email,
        password,
        options: {
          data: {
            name: name || preview.name || preview.email,
          },
          emailRedirectTo: buildConfirmURL({ claimToken, nextPath }),
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (data.session) {
        const completeResponse = await fetch('/api/auth/claim-account/complete', {
          body: JSON.stringify({ token: claimToken }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        if (!completeResponse.ok) {
          const completePayload = await completeResponse.json().catch(() => null)
          throw new Error(readErrorMessage(completePayload, 'Could not finish claiming your account.'))
        }

        router.push(nextPath)
        router.refresh()
        return
      }

      setSuccess('Check your email to finish claiming this account.')
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Could not claim this account right now.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border bg-muted/40 p-4 text-left">
        <div className="text-sm font-medium">
          {preview.mode === 'invite' ? 'Company invite ready' : 'Account ready to claim'}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">{preview.email}</div>
        {preview.accountName ? (
          <div className="mt-1 text-sm text-muted-foreground">{preview.accountName}</div>
        ) : null}
      </div>

      <Button className="w-full" disabled={pending} onClick={handleMagicClaim} type="button" variant="outline">
        {pending ? 'Sending claim link...' : 'Email me a one-time claim link'}
      </Button>

      <form className="grid gap-4" onSubmit={handlePasswordClaim}>
        <div className="grid gap-2 text-left">
          <Label htmlFor="claim-name">Name</Label>
          <Input
            id="claim-name"
            name="name"
            autoComplete="name"
            defaultValue={preview.name || ''}
            placeholder="Your name"
          />
        </div>
        <div className="grid gap-2 text-left">
          <Label htmlFor="claim-password">Choose a password</Label>
          <Input
            id="claim-password"
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
          {pending ? 'Claiming account...' : 'Claim with password'}
        </Button>
      </form>
    </div>
  )
}
