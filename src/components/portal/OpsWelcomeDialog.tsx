'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { AuthError } from '@/components/auth/auth-error'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function OpsWelcomeDialog({
  openInitially,
  userName,
}: {
  openInitially: boolean
  userName: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(openInitially)
  const [pending, setPending] = useState(false)

  async function handleContinue() {
    setPending(true)
    setError(null)

    try {
      const response = await fetch('/api/internal/ops/welcome', {
        method: 'POST',
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error || 'Could not save your welcome state.')
      }

      setOpen(false)
      router.refresh()
    } catch (dismissError) {
      setError(
        dismissError instanceof Error
          ? dismissError.message
          : 'Could not save your welcome state.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!pending && nextOpen) {
          setOpen(true)
        }
      }}
      open={open}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Welcome to ops, {userName}</DialogTitle>
          <DialogDescription>
            This is the internal Grime Time command layer for staff. Customer-facing portal work stays
            under the customer dashboard; this surface is for internal triage, planning, CRM follow-up,
            and admin operations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 text-sm text-muted-foreground">
          <p>Start here when you need to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>scan the KPI strip and chart on the ops dashboard</li>
            <li>open Ops workspace for CRM, billing, scorecard, assets, and milestones</li>
            <li>use the portal docs and Payload admin shortcuts without leaving the shell</li>
          </ul>
          <p>
            You only need to confirm this once for this account. After you continue, the ops dashboard
            becomes your normal landing surface.
          </p>
        </div>
        {error ? <AuthError message={error} /> : null}
        <DialogFooter>
          <Button disabled={pending} onClick={handleContinue} type="button">
            {pending ? 'Saving...' : 'Continue to ops'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
