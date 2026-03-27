'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DetailState } from '@/components/portal/command-center/types'
import type { CrmRecordDetail } from '@/lib/crm/workspace'
import { queryKeys } from '@/lib/query/queryKeys'
import { requestJson } from '@/lib/query/request'

type OwnerOption = {
  email: string
  id: string
  label: string
}

async function fetchOwnerOptions() {
  return requestJson<{ options: OwnerOption[] }>('/api/internal/crm/owners', {
    cache: 'no-store',
  })
}

async function patchOwner(args: { id: string; kind: CrmRecordDetail['kind']; ownerId: null | string }) {
  return requestJson<{ id: string; ownerId: null | string }>('/api/internal/crm/owner', {
    body: JSON.stringify({
      id: Number(args.id),
      kind: args.kind,
      ownerId: args.ownerId ? Number(args.ownerId) : null,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  })
}

export function CrmWorkspaceOwnerField({
  detail,
  reloadDetail,
  setDetail,
}: {
  detail: CrmRecordDetail
  reloadDetail?: (() => Promise<DetailState | null>) | null
  setDetail: (value: DetailState) => void
}) {
  const queryClient = useQueryClient()
  const [selectedOwnerId, setSelectedOwnerId] = React.useState(detail.ownerId ?? 'unassigned')
  const ownerOptionsQuery = useQuery({
    queryFn: fetchOwnerOptions,
    queryKey: queryKeys.crmOwners,
  })

  React.useEffect(() => {
    setSelectedOwnerId(detail.ownerId ?? 'unassigned')
  }, [detail.ownerId])

  const mutation = useMutation({
    mutationFn: async () =>
      patchOwner({
        id: detail.id,
        kind: detail.kind,
        ownerId: selectedOwnerId === 'unassigned' ? null : selectedOwnerId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['crm-workspace'],
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.crmRecord(detail.kind, detail.id),
      })

      if (reloadDetail) {
        const nextDetail = await reloadDetail()
        if (nextDetail) {
          setDetail(nextDetail)
        }
      }
    },
  })

  if (!detail.canAssignOwner) {
    return null
  }

  const options = ownerOptionsQuery.data?.options ?? []

  return (
    <div className="rounded-2xl border bg-background/80 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Owner</p>
          <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
            <SelectTrigger className="mt-2 h-9 text-sm">
              <SelectValue placeholder="Assign owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          size="sm"
          className="h-9"
          disabled={mutation.isPending || ownerOptionsQuery.isLoading}
          onClick={() => void mutation.mutateAsync()}
        >
          {mutation.isPending ? 'Saving...' : 'Assign'}
        </Button>
      </div>

      {mutation.isSuccess ? <p className="mt-2 text-xs text-emerald-600">Owner updated.</p> : null}
      {mutation.error ? <p className="mt-2 text-xs text-destructive">{mutation.error.message}</p> : null}
    </div>
  )
}
