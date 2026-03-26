import { ArrowUpRightIcon, Clock3Icon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { CrmWorkspaceQueue, CrmWorkspaceQueueItem, CrmWorkspaceQuickAction } from '@/lib/crm/workspace'

import { cn } from '@/utilities/ui'
import { CrmWorkspaceItemActions } from './CrmWorkspaceItemActions'

function badgeVariant(item: CrmWorkspaceQueueItem): 'default' | 'destructive' | 'secondary' {
  if (item.stale) return 'destructive'
  if (item.priorityLabel && ['Urgent', 'High'].includes(item.priorityLabel)) return 'default'
  return 'secondary'
}

export function CrmWorkspaceQueueList({
  activeItemId,
  actionLoadingKey,
  loadingItemId,
  onAction,
  onSelect,
  queue,
}: {
  activeItemId: null | string
  actionLoadingKey: null | string
  loadingItemId: null | string
  onAction: (item: CrmWorkspaceQueueItem, action: CrmWorkspaceQuickAction) => void
  onSelect: (item: CrmWorkspaceQueueItem) => void
  queue: CrmWorkspaceQueue
}) {
  if (queue.items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-sm text-muted-foreground">{queue.emptyMessage}</CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3">
      {queue.items.map((item) => {
        const itemKey = `${item.kind}:${item.id}`
        const isActive = activeItemId === itemKey
        const isLoading = loadingItemId === itemKey

        return (
          <button
            key={itemKey}
            type="button"
            className={cn(
              'rounded-2xl border bg-card p-4 text-left transition hover:border-primary/40 hover:bg-muted/20',
              isActive && 'border-primary bg-primary/5',
            )}
            onClick={() => onSelect(item)}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium leading-tight">{item.title}</p>
                  <Badge variant={badgeVariant(item)} className="text-[10px] uppercase">
                    {item.statusLabel}
                  </Badge>
                  {item.priorityLabel ? (
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {item.priorityLabel}
                    </Badge>
                  ) : null}
                  {item.badgeLabel ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {item.badgeLabel}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>
                {item.meta.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {item.meta.map((meta) => (
                      <span key={meta} className="rounded-full border px-2 py-1">
                        {meta}
                      </span>
                    ))}
                  </div>
                ) : null}
                <CrmWorkspaceItemActions actionLoadingKey={actionLoadingKey} item={item} onAction={onAction} />
              </div>

              <div className="flex items-center gap-2">
                {item.stale ? <Clock3Icon className="size-4 text-destructive" /> : null}
                <a
                  href={item.href}
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex size-8 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted"
                  aria-label={`Open ${item.title} in Payload`}
                >
                  <ArrowUpRightIcon className="size-4" />
                </a>
              </div>
            </div>

            {isLoading ? <p className="mt-3 text-xs text-muted-foreground">Loading detail...</p> : null}
          </button>
        )
      })}
    </div>
  )
}
