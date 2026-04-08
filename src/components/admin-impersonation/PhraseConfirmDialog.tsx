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

/** Default confirmation phrase for bulk / high-impact composer actions. */
export const COMPOSER_BULK_CONFIRM_PHRASE = 'grimetime'

export type PhraseConfirmDialogProps = {
  busy?: boolean
  confirmButtonLabel?: string
  description: ReactNode
  /** Phrase the user must type (case-insensitive). Defaults to `grimetime`. */
  expectedPhrase?: string
  onConfirm: () => void | Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
  title: string
}

/**
 * Destructive confirmation: user must type a phrase (default `grimetime`) before confirming.
 */
export function PhraseConfirmDialog({
  busy = false,
  confirmButtonLabel = 'Confirm',
  description,
  expectedPhrase = COMPOSER_BULK_CONFIRM_PHRASE,
  onConfirm,
  onOpenChange,
  open,
  title,
}: PhraseConfirmDialogProps) {
  const [value, setValue] = useState('')
  const fieldId = useId()

  const normalizedExpected = expectedPhrase.trim().toLowerCase()
  const matches = value.trim().toLowerCase() === normalizedExpected && normalizedExpected.length > 0

  useEffect(() => {
    if (!open) {
      setValue('')
    }
  }, [open])

  async function handleConfirm() {
    if (!matches || busy) {
      return
    }
    setValue('')
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
          <DialogDescription className="space-y-3">{description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/70 bg-muted/40 px-3 py-2 font-mono text-sm text-foreground">
          {expectedPhrase}
        </div>

        <div className="grid gap-2">
          <label className={adminPanelChrome.fieldLabel} htmlFor={fieldId}>
            Type the phrase to confirm
          </label>
          <Input
            autoComplete="off"
            autoFocus
            className="h-10 rounded-xl font-mono"
            id={fieldId}
            onChange={(event) => setValue(event.target.value)}
            placeholder={expectedPhrase}
            spellCheck={false}
            type="text"
            value={value}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button className="rounded-xl" onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancel
          </Button>
          <Button
            className="rounded-xl"
            disabled={!matches || busy}
            onClick={() => void handleConfirm()}
            type="button"
            variant="destructive"
          >
            {busy ? 'Working…' : confirmButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
