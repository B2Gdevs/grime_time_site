'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { DetailState } from '@/components/portal/command-center/types'
import { queryKeys } from '@/lib/query/queryKeys'
import { requestJson } from '@/lib/query/request'
import type {
  CrmRecordDetail,
  CrmWorkspaceData,
  CrmWorkspaceOwnerScope,
  CrmWorkspaceQueueItem,
  CrmWorkspaceQueueKey,
} from '@/lib/crm/workspace'

import { crmDetailToPanelState } from './detail-state'

type SelectedRecord = {
  id: string
  kind: CrmWorkspaceQueueItem['kind']
}

async function fetchWorkspace(args: {
  commercialOnly: boolean
  ownerScope: CrmWorkspaceOwnerScope
  searchQuery: string
}) {
  const params = new URLSearchParams()
  const { commercialOnly, ownerScope, searchQuery } = args

  if (commercialOnly) {
    params.set('commercial', '1')
  }

  if (ownerScope !== 'all') {
    params.set('owner', ownerScope)
  }

  if (searchQuery.trim()) {
    params.set('q', searchQuery.trim())
  }

  return requestJson<CrmWorkspaceData>(
    `/api/internal/crm/workspace${params.size > 0 ? `?${params.toString()}` : ''}`,
    {
      cache: 'no-store',
    },
  )
}

async function fetchRecordDetail(record: SelectedRecord) {
  return requestJson<CrmRecordDetail>(`/api/internal/crm/record?type=${record.kind}&id=${record.id}`, {
    cache: 'no-store',
  })
}

async function patchTaskStatus(args: { id: string; status: 'completed' | 'in_progress' }) {
  return requestJson<{ completedAt?: null | string; id: string; status: string }>('/api/internal/crm/task', {
    body: JSON.stringify({
      id: Number(args.id),
      status: args.status,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  })
}

async function patchOpportunityStage(args: { id: string; stage: string }) {
  return requestJson<{ id: string; stage: string; status: string }>('/api/internal/crm/opportunity', {
    body: JSON.stringify({
      id: Number(args.id),
      stage: args.stage,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  })
}

async function patchLeadStatus(args: { id: string; status: 'disqualified' | 'qualified' }) {
  return requestJson<{ id: string; status: string }>('/api/internal/crm/lead', {
    body: JSON.stringify({
      id: Number(args.id),
      status: args.status,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  })
}

export function useCrmWorkspace(args: {
  initialData: CrmWorkspaceData
  setDetail: (value: DetailState) => void
}) {
  const { initialData, setDetail } = args
  const queryClient = useQueryClient()
  const [selectedQueue, setSelectedQueue] = React.useState<CrmWorkspaceQueueKey>(
    initialData.queues[0]?.key ?? 'attention',
  )
  const [searchValue, setSearchValue] = React.useState(initialData.searchQuery ?? '')
  const [ownerScope, setOwnerScope] = React.useState<CrmWorkspaceOwnerScope>(
    initialData.ownerScope ?? 'all',
  )
  const [staleOnly, setStaleOnly] = React.useState(false)
  const [commercialOnly, setCommercialOnly] = React.useState(initialData.commercialOnly ?? false)
  const [activeItemId, setActiveItemId] = React.useState<null | string>(null)
  const [selectedRecord, setSelectedRecord] = React.useState<null | SelectedRecord>(null)
  const deferredSearchValue = React.useDeferredValue(searchValue)
  const normalizedSearch = deferredSearchValue.trim()

  const workspaceQuery = useQuery({
    initialData,
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      fetchWorkspace({
        commercialOnly,
        ownerScope,
        searchQuery: normalizedSearch,
      }),
    queryKey: queryKeys.crmWorkspace({
      commercialOnly,
      ownerScope,
      searchQuery: normalizedSearch,
    }),
  })

  const recordQuery = useQuery({
    enabled: Boolean(selectedRecord),
    placeholderData: (previousData) => previousData,
    queryFn: () => fetchRecordDetail(selectedRecord as SelectedRecord),
    queryKey: selectedRecord
      ? queryKeys.crmRecord(selectedRecord.kind, selectedRecord.id)
      : ['crm-record', 'idle'],
  })

  React.useEffect(() => {
    if (!recordQuery.data || !selectedRecord) {
      return
    }

    const buildDetailState = (value: CrmRecordDetail): DetailState =>
      crmDetailToPanelState(value, async () => {
        const refreshed = await queryClient.fetchQuery({
          queryFn: () => fetchRecordDetail(selectedRecord),
          queryKey: queryKeys.crmRecord(selectedRecord.kind, selectedRecord.id),
        })

        return buildDetailState(refreshed)
      })

    setDetail(buildDetailState(recordQuery.data))
  }, [queryClient, recordQuery.data, selectedRecord, setDetail])

  const actionMutation = useMutation({
    mutationFn: async (input: {
      action: NonNullable<CrmWorkspaceQueueItem['actions']>[number]
      item: CrmWorkspaceQueueItem
    }) => {
      if (input.action.kind === 'complete-task') {
        await patchTaskStatus({ id: input.item.id, status: 'completed' })
        return
      }

      if (input.action.kind === 'set-task-in-progress') {
        await patchTaskStatus({ id: input.item.id, status: 'in_progress' })
        return
      }

      if (input.action.kind === 'advance-opportunity' && input.action.nextStage) {
        await patchOpportunityStage({ id: input.item.id, stage: input.action.nextStage })
        return
      }

      if (input.action.kind === 'qualify-lead') {
        await patchLeadStatus({ id: input.item.id, status: 'qualified' })
        return
      }

      if (input.action.kind === 'disqualify-lead') {
        await patchLeadStatus({ id: input.item.id, status: 'disqualified' })
      }
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['crm-workspace'],
      })

      if (activeItemId === `${variables.item.kind}:${variables.item.id}`) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.crmRecord(variables.item.kind, variables.item.id),
        })
      }
    },
  })

  const workspace = workspaceQuery.data
  const activeQueue =
    workspace.queues.find((queue) => queue.key === selectedQueue) ??
    workspace.queues[0] ?? {
      description: '',
      emptyMessage: 'No CRM data available.',
      items: [],
      key: 'attention' as const,
      label: 'Needs attention',
    }

  const visibleQueue = {
    ...activeQueue,
    emptyMessage: staleOnly
      ? `No stale items are currently showing in ${activeQueue.label.toLowerCase()}.`
      : activeQueue.emptyMessage,
    items: staleOnly ? activeQueue.items.filter((item) => item.stale) : activeQueue.items,
  }
  const actionLoadingKey =
    actionMutation.isPending && actionMutation.variables
      ? `${actionMutation.variables.item.kind}:${actionMutation.variables.item.id}:${actionMutation.variables.action.kind}:${actionMutation.variables.action.nextStage ?? ''}`
      : null

  return {
    activeItemId,
    actionLoadingKey,
    activeQueue,
    isRefreshing: workspaceQuery.isFetching,
    loadingItemId:
      recordQuery.isFetching && selectedRecord ? `${selectedRecord.kind}:${selectedRecord.id}` : null,
    onAction: async (
      item: CrmWorkspaceQueueItem,
      action: NonNullable<CrmWorkspaceQueueItem['actions']>[number],
    ) => {
      await actionMutation.mutateAsync({ action, item })
    },
    onRefresh: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['crm-workspace'],
      })
    },
    onSearchChange: setSearchValue,
    onSelectItem: (item: CrmWorkspaceQueueItem) => {
      setActiveItemId(`${item.kind}:${item.id}`)
      setSelectedRecord({
        id: item.id,
        kind: item.kind,
      })
    },
    onStaleOnlyChange: setStaleOnly,
    onCommercialOnlyChange: setCommercialOnly,
    onOwnerScopeChange: setOwnerScope,
    ownerScope,
    searchValue,
    selectedQueue,
    setSelectedQueue,
    commercialOnly,
    staleOnly,
    visibleQueue,
    workspace,
  }
}
