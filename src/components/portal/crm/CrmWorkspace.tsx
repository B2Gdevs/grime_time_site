'use client'

import * as React from 'react'
import { InfoIcon, RefreshCcwIcon } from 'lucide-react'

import type { DetailState } from '@/components/portal/command-center/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type {
  CrmRecordDetail,
  CrmWorkspaceData,
  CrmWorkspaceQueueItem,
  CrmWorkspaceQueueKey,
} from '@/lib/crm/workspace'

import { crmDetailToPanelState } from './detail-state'
import { CrmWorkspaceMetrics } from './CrmWorkspaceMetrics'
import { CrmWorkspaceQueueList } from './CrmWorkspaceQueueList'
import { CrmWorkspaceToolbar } from './CrmWorkspaceToolbar'

const crmOverviewDetail: DetailState = {
  body:
    'This workspace is the first-party CRM surface for queues, companies, tasks, opportunities, and sequence automation. Use the queue group to triage work, then click any row to load its structured detail into the left context panel instead of opening overlapping drawers.',
  description: 'First-party CRM overview',
  kind: 'text',
  title: 'CRM workspace',
}

function queueLink(queue: CrmWorkspaceQueueKey): string {
  switch (queue) {
    case 'attention':
      return '/admin/collections/leads'
    case 'pipeline':
      return '/admin/collections/opportunities'
    case 'tasks':
      return '/admin/collections/crm-tasks'
    case 'accounts':
      return '/admin/collections/accounts'
    case 'automation':
      return '/admin/collections/crm-sequences'
    default:
      return '/admin'
  }
}

export function CrmWorkspace({
  initialData,
  setDetail,
}: {
  initialData: CrmWorkspaceData
  setDetail: (value: DetailState) => void
}) {
  const [workspace, setWorkspace] = React.useState(initialData)
  const [selectedQueue, setSelectedQueue] = React.useState<CrmWorkspaceQueueKey>(
    initialData.queues[0]?.key ?? 'attention',
  )
  const [searchValue, setSearchValue] = React.useState(initialData.searchQuery ?? '')
  const [staleOnly, setStaleOnly] = React.useState(false)
  const [activeItemId, setActiveItemId] = React.useState<null | string>(null)
  const [actionLoadingKey, setActionLoadingKey] = React.useState<null | string>(null)
  const [loadingItemId, setLoadingItemId] = React.useState<null | string>(null)
  const deferredSearchValue = React.useDeferredValue(searchValue)
  const [isRefreshing, startRefresh] = React.useTransition()

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

  const fetchWorkspace = React.useCallback(async (searchQuery: string) => {
    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim())
    }

    const response = await fetch(`/api/internal/crm/workspace${params.size > 0 ? `?${params.toString()}` : ''}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as CrmWorkspaceData
  }, [])

  const handleRefresh = React.useCallback(() => {
    startRefresh(async () => {
      const nextWorkspace = await fetchWorkspace(searchValue)
      if (nextWorkspace) {
        setWorkspace(nextWorkspace)
      }
    })
  }, [fetchWorkspace, searchValue])

  const handleSelectItem = React.useCallback(
    async (item: CrmWorkspaceQueueItem) => {
      const itemKey = `${item.kind}:${item.id}`
      setActiveItemId(itemKey)
      setLoadingItemId(itemKey)

      try {
        const loadDetail = async () => {
          const response = await fetch(`/api/internal/crm/record?type=${item.kind}&id=${item.id}`, {
            cache: 'no-store',
          })

          if (!response.ok) {
            return null
          }

          return (await response.json()) as CrmRecordDetail
        }

        const detail = await loadDetail()

        if (!detail) {
          return
        }

        const toDetailState = (value: CrmRecordDetail): DetailState =>
          crmDetailToPanelState(value, async () => {
            const nextDetail = await loadDetail()
            return nextDetail ? toDetailState(nextDetail) : null
          })

        setDetail(toDetailState(detail))
      } finally {
        setLoadingItemId(null)
      }
    },
    [setDetail],
  )

  const handleAction = React.useCallback(
    async (item: CrmWorkspaceQueueItem, action: NonNullable<CrmWorkspaceQueueItem['actions']>[number]) => {
      const actionKey = `${item.kind}:${item.id}:${action.kind}:${action.nextStage ?? ''}`
      setActionLoadingKey(actionKey)

      try {
        let response: Response | null = null

        if (action.kind === 'complete-task') {
          response = await fetch('/api/internal/crm/task', {
            body: JSON.stringify({ id: Number(item.id), status: 'completed' }),
            headers: { 'Content-Type': 'application/json' },
            method: 'PATCH',
          })
        }

        if (action.kind === 'set-task-in-progress') {
          response = await fetch('/api/internal/crm/task', {
            body: JSON.stringify({ id: Number(item.id), status: 'in_progress' }),
            headers: { 'Content-Type': 'application/json' },
            method: 'PATCH',
          })
        }

        if (action.kind === 'advance-opportunity' && action.nextStage) {
          response = await fetch('/api/internal/crm/opportunity', {
            body: JSON.stringify({ id: Number(item.id), stage: action.nextStage }),
            headers: { 'Content-Type': 'application/json' },
            method: 'PATCH',
          })
        }

        if (!response?.ok) {
          return
        }

        const nextWorkspace = await fetchWorkspace(searchValue)
        if (nextWorkspace) {
          setWorkspace(nextWorkspace)
        }

        if (activeItemId === `${item.kind}:${item.id}`) {
          await handleSelectItem(item)
        }
      } finally {
        setActionLoadingKey(null)
      }
    },
    [activeItemId, fetchWorkspace, handleSelectItem, searchValue],
  )

  React.useEffect(() => {
    const normalizedQuery = deferredSearchValue.trim()
    const currentQuery = workspace.searchQuery?.trim() ?? ''

    if (normalizedQuery === currentQuery) {
      return
    }

    startRefresh(async () => {
      const nextWorkspace = await fetchWorkspace(normalizedQuery)
      if (nextWorkspace) {
        setWorkspace(nextWorkspace)
      }
    })
  }, [deferredSearchValue, fetchWorkspace, workspace.searchQuery])

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>CRM workspace</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    aria-label="CRM workspace help"
                    onClick={() => setDetail(crmOverviewDetail)}
                  >
                    <InfoIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Queue triage and record detail live here instead of in overlapping drawers.
                </TooltipContent>
              </Tooltip>
            </div>
            <CardDescription>{activeQueue.description}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCcwIcon className="size-3.5" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <a href={queueLink(activeQueue.key)}>Open collection</a>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4">
        <CrmWorkspaceMetrics metrics={workspace.metrics} />

        <div className="grid gap-3">
          <CrmWorkspaceToolbar
            onSearchChange={setSearchValue}
            onStaleOnlyChange={setStaleOnly}
            searchValue={searchValue}
            staleOnly={staleOnly}
          />

          <ToggleGroup
            type="single"
            value={selectedQueue}
            onValueChange={(value) => {
              if (value) setSelectedQueue(value as CrmWorkspaceQueueKey)
            }}
            className="flex flex-wrap justify-start rounded-2xl border bg-muted/30 p-1"
          >
            {workspace.queues.map((queue) => (
              <ToggleGroupItem
                key={queue.key}
                value={queue.key}
                variant="outline"
                size="sm"
                className="rounded-xl border-0 px-3 text-xs data-[state=on]:bg-background"
              >
                {queue.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <CrmWorkspaceQueueList
            activeItemId={activeItemId}
            actionLoadingKey={actionLoadingKey}
            loadingItemId={loadingItemId}
            onAction={handleAction}
            onSelect={handleSelectItem}
            queue={visibleQueue}
          />
        </div>
      </CardContent>
    </Card>
  )
}
