'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BoxesIcon, PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { OpsAssetLadderRow } from '@/lib/ops/opsDashboardTypes'
import { queryKeys } from '@/lib/query/queryKeys'
import { requestJson } from '@/lib/query/request'

import type { DetailState } from './types'
import {
  AssetInventoryForm,
  emptyAssetDraft,
  type AssetInventoryDraft,
} from '@/components/portal/ops/assets/AssetInventoryForm'
import { AssetInventoryTable } from '@/components/portal/ops/assets/AssetInventoryTable'

async function fetchOpsAssets() {
  return requestJson<{ items: OpsAssetLadderRow[] }>('/api/internal/ops/assets', {
    cache: 'no-store',
  })
}

function rowToDraft(row: OpsAssetLadderRow): AssetInventoryDraft {
  return {
    buyNotes: row.buyNotes ?? '',
    label: row.label,
    owned: row.owned ?? false,
    sortOrder: row.sortOrder != null ? String(row.sortOrder) : '0',
    whyNotes: row.whyNotes ?? '',
  }
}

export function AssetsPanel({
  assetLadderItems,
  setDetail,
}: {
  assetLadderItems: OpsAssetLadderRow[]
  setDetail: (value: DetailState) => void
}) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = React.useState<AssetInventoryDraft>(emptyAssetDraft)
  const [editingId, setEditingId] = React.useState<null | string>(null)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [notice, setNotice] = React.useState<null | string>(null)

  const assetsQuery = useQuery({
    initialData: { items: assetLadderItems },
    placeholderData: (previous) => previous,
    queryFn: fetchOpsAssets,
    queryKey: queryKeys.opsAssets,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        buyNotes: draft.buyNotes,
        label: draft.label,
        owned: draft.owned,
        sortOrder: Number(draft.sortOrder) || 0,
        whyNotes: draft.whyNotes,
      }

      if (editingId) {
        return requestJson<{ item: OpsAssetLadderRow }>(`/api/internal/ops/assets/${editingId}`, {
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        })
      }

      return requestJson<{ item: OpsAssetLadderRow }>('/api/internal/ops/assets', {
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : 'Unable to save asset.')
    },
    onSuccess: async () => {
      setNotice(editingId ? 'Asset updated.' : 'Asset added.')
      setDraft(emptyAssetDraft())
      setEditingId(null)
      setIsFormOpen(false)
      await queryClient.invalidateQueries({ queryKey: queryKeys.opsAssets })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      requestJson<{ ok: boolean }>(`/api/internal/ops/assets/${id}`, {
        method: 'DELETE',
      }),
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : 'Unable to delete asset.')
    },
    onSuccess: async () => {
      setNotice('Asset removed.')
      if (editingId) {
        setDraft(emptyAssetDraft())
        setEditingId(null)
        setIsFormOpen(false)
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.opsAssets })
    },
  })

  function openCreateForm() {
    setDraft(emptyAssetDraft())
    setEditingId(null)
    setIsFormOpen(true)
    setNotice(null)
  }

  function openEditForm(item: OpsAssetLadderRow) {
    setDraft(rowToDraft(item))
    setEditingId(item.id)
    setIsFormOpen(true)
    setNotice(null)
  }

  function resetForm() {
    setDraft(emptyAssetDraft())
    setEditingId(null)
    setIsFormOpen(false)
  }

  return (
    <Card data-tour="portal-assets-panel">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle>Asset inventory</CardTitle>
          <CardDescription>Manage the real equipment you have here first, then add planned gear as the business grows.</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="h-8 shrink-0 text-xs" onClick={openCreateForm}>
          <PlusIcon className="size-3.5" />
          Add asset
        </Button>
      </CardHeader>
      <CardContent className="rounded-lg border">
        <div className="grid gap-4 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <BoxesIcon className="size-4" />
            {assetsQuery.data.items.length === 1
              ? '1 tracked asset in the ops inventory.'
              : `${assetsQuery.data.items.length} tracked assets in the ops inventory.`}
          </div>

          {isFormOpen ? (
            <AssetInventoryForm
              draft={draft}
              isSaving={saveMutation.isPending}
              mode={editingId ? 'edit' : 'create'}
              onCancel={resetForm}
              onChange={setDraft}
              onSubmit={() => saveMutation.mutate()}
            />
          ) : null}

          <AssetInventoryTable
            deletingId={deleteMutation.isPending ? deleteMutation.variables ?? null : null}
            items={assetsQuery.data.items}
            onDelete={(item) => deleteMutation.mutate(item.id)}
            onEdit={openEditForm}
            onInfo={(item) =>
              setDetail({
                body: `Details / spec:\n${item.buyNotes ?? '-'}\n\nOps notes:\n${item.whyNotes ?? '-'}\n\nStatus:\n${item.owned ? 'Have' : 'Want'}`,
                description: 'Asset detail',
                title: item.label,
              })
            }
          />

          {notice ? <div className="text-sm text-muted-foreground">{notice}</div> : null}
        </div>
      </CardContent>
    </Card>
  )
}
