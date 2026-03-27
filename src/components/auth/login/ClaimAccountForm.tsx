'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'

import { AuthError } from '@/components/auth/auth-error'
import { AuthNotice } from '@/components/auth/AuthNotice'
import { readErrorMessage } from '@/components/auth/read-error-message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { getClientSideURL } from '@/utilities/getURL'

type ClaimPreview = {
  accountName: null | string
  email: string
  expiresAt: null | string
  mode: 'claim' | 'invite'
  name: null | string
}

type Props = {
  claimToken: null | string
  nextPath: string
}

function buildConfirmURL(args: { claimToken: string; nextPath: string }) {
  const url = new URL('/auth/confirm', getClientSideURL())
  url.searchParams.set('claim', args.claimToken)
  url.searchParams.set('next', args.nextPath)
  return url.toString()
}

export function ClaimAccountForm({ claimToken, nextPath }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [preview, setPreview] = useState<ClaimPreview | null>(null)
  const [previewPending, setPreviewPending] = useState(Boolean(claimToken))
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadPreview() {
      if (!claimToken) {
        setPreview(null)
        setPreviewPending(false)
        return
      }

      setPreviewPending(true)
      setError(null)

      try {
        const response = await fetch(`/api/auth/claim-account?token=${encodeURIComponent(claimToken)}`, {
          cache: 'no-store',
        })
        const body = (await response.json().catch(() => null)) as {
          error?: string
          preview?: ClaimPreview
        } | null

        if (!response.ok || !body?.preview) {
          throw new Error(readErrorMessage(body, 'That claim link is invalid or expired.'))
        }

        if (active) {
          setPreview(body.preview)
        }
      } catch (loadError) {
        if (active) {
          setPreview(null)
          setError(loadError instanceof Error ? loadError.message : 'Could not load that claim link.')
        }
      } finally {
        if (active) {
          setPreviewPending(false)
        }
      }
    }

    void loadPreview()

    return () => {
      active = false
    }
  }, [claimToken])

  async function handleClaimRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setSuccess(null)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim().toLowerCase()

    try {
      const response = await fetch('/api/auth/claim-account', {
        body: JSON.stringify({ email }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null
      if (!response.ok) {
        throw new Error(readErrorMessage(body, 'Could not send your claim link.'))
      }

      setSuccess(body?.message || 'If that email exists in Grime Time, we sent a secure claim link.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not send your claim link.')
    } finally {
      setPending(false)
    }
  }

  async function handleMagicClaim() {
    if (!claimToken || !preview) return

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
    if (!claimToken || !preview) return

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

  if (!claimToken) {
    return (
      <form className="grid gap-4" onSubmit={handleClaimRequest}>
        <div className="grid gap-2 text-left">
          <Label htmlFor="claim-email">Email</Label>
          <Input id="claim-email" name="email" type="email" autoComplete="email" required />
        </div>
        {error ? <AuthError message={error} /> : null}
        {success ? <AuthNotice message={success} /> : null}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? 'Sending claim link...' : 'Email my account link'}
        </Button>
      </form>
    )
  }

  if (previewPending) {
    return <div className="text-sm text-muted-foreground">Loading your account link...</div>
  }

  if (!preview) {
    return error ? <AuthError message={error} /> : <AuthError message="That claim link is invalid or expired." />
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
