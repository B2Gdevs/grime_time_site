'use client'

import { Show, SignInButton, SignUpButton, useAuth } from '@clerk/nextjs'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'

import { AuthError } from '@/components/auth/auth-error'
import { AuthNotice } from '@/components/auth/AuthNotice'
import { readErrorMessage } from '@/components/auth/read-error-message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isClerkClientConfigured } from '@/lib/clerk/config'

const SupabaseClaimAccountPanel = dynamic(
  () =>
    import('@/components/auth/login/SupabaseClaimAccountPanel').then((module) => ({
      default: module.SupabaseClaimAccountPanel,
    })),
  { ssr: false },
)

export type ClaimPreview = {
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

function inviteActionLabels(preview: ClaimPreview) {
  if (preview.mode === 'invite') {
    return {
      finish: 'Finish joining this company',
      signIn: 'Sign in to join company',
      signUp: 'Create account and join company',
      summary: preview.accountName
        ? `Use ${preview.email} to join ${preview.accountName}.`
        : `Use ${preview.email} to join this company access.`,
    }
  }

  return {
    finish: 'Finish claiming this account',
    signIn: 'Sign in to claim account',
    signUp: 'Create account and claim',
    summary: `Use ${preview.email} to claim your existing customer record.`,
  }
}

export function ClaimAccountForm({ claimToken, nextPath }: Props) {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [preview, setPreview] = useState<ClaimPreview | null>(null)
  const [previewPending, setPreviewPending] = useState(Boolean(claimToken))
  const [success, setSuccess] = useState<string | null>(null)
  const clerkConfigured = isClerkClientConfigured()

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

  if (clerkConfigured) {
    const labels = inviteActionLabels(preview)

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

        <div className="rounded-xl border border-border/70 bg-muted/35 p-4 text-sm text-muted-foreground">
          {labels.summary} Sign in or create your account with Clerk using{' '}
          <strong>{preview.email}</strong>. Once the session is active, finish below and Grime Time
          will bind that identity to the right customer access.
        </div>

        <Show when="signed-out">
          <div className="grid gap-3">
            <SignInButton fallbackRedirectUrl={`/claim-account?claim=${encodeURIComponent(claimToken)}&next=${encodeURIComponent(nextPath)}`} mode="modal">
              <Button className="w-full">{labels.signIn}</Button>
            </SignInButton>
            <SignUpButton fallbackRedirectUrl={`/claim-account?claim=${encodeURIComponent(claimToken)}&next=${encodeURIComponent(nextPath)}`} mode="modal">
              <Button className="w-full" variant="outline">{labels.signUp}</Button>
            </SignUpButton>
          </div>
        </Show>

        <Show when="signed-in">
          <Button className="w-full" disabled={pending || !isSignedIn} onClick={handleClerkClaimFinish} type="button">
            {pending ? 'Finishing secure access...' : labels.finish}
          </Button>
        </Show>

        {error ? <AuthError message={error} /> : null}
        {success ? <AuthNotice message={success} /> : null}
      </div>
    )
  }

  return <SupabaseClaimAccountPanel claimToken={claimToken} nextPath={nextPath} preview={preview} />

  async function handleClerkClaimFinish() {
    if (!claimToken) {
      return
    }

    setPending(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/auth/claim-account/complete', {
        body: JSON.stringify({ token: claimToken }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null

      if (!response.ok) {
        throw new Error(readErrorMessage(body, 'Could not finish claiming your account.'))
      }

      setSuccess(body?.message || 'Your account is ready.')
      router.push(nextPath)
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Could not finish claiming your account.',
      )
    } finally {
      setPending(false)
    }
  }
}
