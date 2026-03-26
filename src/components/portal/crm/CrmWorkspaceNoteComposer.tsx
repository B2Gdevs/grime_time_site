'use client'

import * as React from 'react'

import type { DetailState } from '@/components/portal/command-center/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CrmRecordDetail } from '@/lib/crm/workspace'

function defaultTitle(detail: CrmRecordDetail): string {
  switch (detail.kind) {
    case 'account':
      return 'Account note'
    case 'contact':
      return 'Contact note'
    case 'lead':
      return 'Lead note'
    case 'opportunity':
      return 'Opportunity note'
    case 'task':
      return 'Task note'
    case 'sequence-enrollment':
      return 'Automation note'
    default:
      return 'Internal note'
  }
}

export function CrmWorkspaceNoteComposer({
  detail,
  reloadDetail,
  setDetail,
}: {
  detail: CrmRecordDetail
  reloadDetail?: (() => Promise<DetailState | null>) | null
  setDetail: (value: DetailState) => void
}) {
  const [title, setTitle] = React.useState(() => defaultTitle(detail))
  const [body, setBody] = React.useState('')
  const [error, setError] = React.useState<null | string>(null)
  const [successMessage, setSuccessMessage] = React.useState<null | string>(null)
  const [isSaving, startSaving] = React.useTransition()

  const canSave = title.trim().length > 0 && body.trim().length > 0

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!canSave) {
        setError('Add a title and note before saving.')
        return
      }

      setError(null)
      setSuccessMessage(null)

      startSaving(async () => {
        const response = await fetch('/api/internal/crm/activity', {
          body: JSON.stringify({
            body: body.trim(),
            recordId: Number(detail.id),
            recordKind: detail.kind,
            title: title.trim(),
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as null | { error?: string }
          setError(payload?.error ?? 'Unable to save the note.')
          return
        }

        setBody('')
        setSuccessMessage('Note saved.')

        if (!reloadDetail) {
          return
        }

        const nextDetail = await reloadDetail()
        if (nextDetail) {
          setDetail(nextDetail)
        }
      })
    },
    [body, canSave, detail.id, detail.kind, reloadDetail, setDetail, title],
  )

  return (
    <form className="grid gap-3 rounded-2xl border bg-muted/10 p-3" onSubmit={handleSubmit}>
      <div className="grid gap-1.5">
        <Label htmlFor={`crm-note-title-${detail.kind}-${detail.id}`}>Note title</Label>
        <Input
          id={`crm-note-title-${detail.kind}-${detail.id}`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Internal note"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`crm-note-body-${detail.kind}-${detail.id}`}>Note</Label>
        <Textarea
          id={`crm-note-body-${detail.kind}-${detail.id}`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Capture the latest call, follow-up, objection, or billing context."
          className="min-h-24 resize-y"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Notes stay inside Payload CRM activity history and refresh the selected record.
        </p>
        <Button type="submit" size="sm" className="h-8 text-xs" disabled={isSaving || !canSave}>
          {isSaving ? 'Saving...' : 'Save note'}
        </Button>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {successMessage ? <p className="text-xs text-emerald-600">{successMessage}</p> : null}
    </form>
  )
}
