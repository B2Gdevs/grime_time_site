'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export type AssetInventoryDraft = {
  buyNotes: string
  label: string
  owned: boolean
  sortOrder: string
  whyNotes: string
}

export function emptyAssetDraft(): AssetInventoryDraft {
  return {
    buyNotes: '',
    label: '',
    owned: true,
    sortOrder: '0',
    whyNotes: '',
  }
}

export function AssetInventoryForm({
  draft,
  isSaving,
  mode,
  onCancel,
  onChange,
  onSubmit,
}: {
  draft: AssetInventoryDraft
  isSaving: boolean
  mode: 'create' | 'edit'
  onCancel: () => void
  onChange: (next: AssetInventoryDraft) => void
  onSubmit: () => void
}) {
  return (
    <div className="grid gap-4 rounded-xl border bg-muted/20 p-4">
      <div className="grid gap-1">
        <h3 className="text-sm font-semibold">{mode === 'create' ? 'Add asset' : 'Edit asset'}</h3>
        <p className="text-xs text-muted-foreground">
          This is the live asset inventory for operations. Update status, details, and notes without leaving Ops workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Asset name</label>
          <Input
            value={draft.label}
            onChange={(event) => onChange({ ...draft, label: event.target.value })}
            placeholder="Pressure washer"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Status</label>
          <Select
            value={draft.owned ? 'have' : 'want'}
            onValueChange={(value) => onChange({ ...draft, owned: value === 'have' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="have">Have</SelectItem>
              <SelectItem value="want">Want</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 md:col-span-2">
          <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Details / spec</label>
          <Textarea
            value={draft.buyNotes}
            onChange={(event) => onChange({ ...draft, buyNotes: event.target.value })}
            placeholder="4 GPM belt-drive pressure washer, hose reel, wand kit"
          />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Ops notes</label>
          <Textarea
            value={draft.whyNotes}
            onChange={(event) => onChange({ ...draft, whyNotes: event.target.value })}
            placeholder="Primary field unit for residential work."
          />
        </div>
        <div className="grid gap-2 md:w-40">
          <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Sort order</label>
          <Input
            inputMode="numeric"
            value={draft.sortOrder}
            onChange={(event) => onChange({ ...draft, sortOrder: event.target.value })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={onSubmit} disabled={isSaving}>
          {mode === 'create' ? 'Save asset' : 'Update asset'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
