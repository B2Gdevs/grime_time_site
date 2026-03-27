'use client'

import * as React from 'react'
import { InfoIcon, RefreshCcwIcon } from 'lucide-react'

import type { DetailState } from '@/components/portal/command-center/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CrmWorkspaceData, CrmWorkspaceQueueKey } from '@/lib/crm/workspace'

import { CrmWorkspaceMetrics } from './CrmWorkspaceMetrics'
import { CrmWorkspaceQueueList } from './CrmWorkspaceQueueList'
import { CrmWorkspaceToolbar } from './CrmWorkspaceToolbar'
import { useCrmWorkspace } from './useCrmWorkspace'

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
  const {
    activeItemId,
    actionLoadingKey,
    activeQueue,
    isRefreshing,
    loadingItemId,
    onAction,
    onRefresh,
    onSearchChange,
    onSelectItem,
    onCommercialOnlyChange,
    onOwnerScopeChange,
    onStaleOnlyChange,
    ownerScope,
    searchValue,
    selectedQueue,
    setSelectedQueue,
    commercialOnly,
    staleOnly,
    visibleQueue,
    workspace,
  } = useCrmWorkspace({
    initialData,
    setDetail,
  })

  return (
    <Card className="border shadow-sm" data-tour="portal-crm-workspace">
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
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => void onRefresh()} disabled={isRefreshing}>
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
            commercialOnly={commercialOnly}
            onCommercialOnlyChange={onCommercialOnlyChange}
            onOwnerScopeChange={onOwnerScopeChange}
            onSearchChange={onSearchChange}
            onStaleOnlyChange={onStaleOnlyChange}
            ownerScope={ownerScope}
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
            onAction={(item, action) => void onAction(item, action)}
            onSelect={onSelectItem}
            queue={visibleQueue}
          />
        </div>
      </CardContent>
    </Card>
  )
}
