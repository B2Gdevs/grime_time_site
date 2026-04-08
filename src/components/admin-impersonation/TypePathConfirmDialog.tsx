'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export type TypePathConfirmDialogProps = {
  /** Disables confirm and shows loading label when true. */
  busy?: boolean
  /** Label for the destructive action (default: "Delete"). */
  confirmButtonLabel?: string
  /** Primary warning / context (shown above the shared “type path” instruction). */
  description: ReactNode
  /** Path the user must type exactly (trimmed for comparison). */
  expectedPath: string
  onConfirm: () => void | Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
  title: string
}

/**
 * Destructive confirmation: user must type `expectedPath` exactly before confirming.
 * Reuse for any composer action that should not run from a single mis-click.
 */
export function TypePathConfirmDialog({
  busy = false,
  confirmButtonLabel = 'Delete',
  description,
  expectedPath,
  onConfirm,
  onOpenChange,
  open,
  title,
}: TypePathConfirmDialogProps) {
  const [confirmPath, setConfirmPath] = useState('')
  const confirmFieldId = useId()

  const trimmedExpected = expectedPath.trim()
  const pathMatches = confirmPath.trim() === trimmedExpected && trimmedExpected.length > 0

  useEffect(() => {
    if (!open) {
      setConfirmPath('')
    }
  }, [open])

  async function handleConfirm() {
    if (!pathMatches || busy) {
      return
    }
    setConfirmPath('')
    try {
      await Promise.resolve(onConfirm())
    } finally {
      onOpenChange(false)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="space-y-3">
            {description}
            <span className="block">
              To confirm, type the page path below exactly as shown (including leading{' '}
              <span className="font-mono text-foreground">/</span>).
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/70 bg-muted/40 px-3 py-2 font-mono text-sm text-foreground">
          {trimmedExpected || '—'}
        </div>

        <div className="grid gap-2">
          <label className={adminPanelChrome.fieldLabel} htmlFor={confirmFieldId}>
            Type page path to confirm
          </label>
          <Input
            autoComplete="off"
            autoFocus
            className="h-10 rounded-xl font-mono"
            id={confirmFieldId}
            onChange={(event) => setConfirmPath(event.target.value)}
            placeholder={trimmedExpected || '/your-page-path'}
            spellCheck={false}
            type="text"
            value={confirmPath}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button className="rounded-xl" onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancel
          </Button>
          <Button
            className="rounded-xl"
            disabled={!pathMatches || busy}
            onClick={() => void handleConfirm()}
            type="button"
            variant="destructive"
          >
            {busy ? 'Deleting…' : confirmButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
