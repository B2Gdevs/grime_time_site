import type { CrmWorkspaceQueueItem, CrmWorkspaceQuickAction } from '@/lib/crm/workspace'

import { Button } from '@/components/ui/button'

export function CrmWorkspaceItemActions({
  actionLoadingKey,
  item,
  onAction,
}: {
  actionLoadingKey: null | string
  item: CrmWorkspaceQueueItem
  onAction: (item: CrmWorkspaceQueueItem, action: CrmWorkspaceQuickAction) => void
}) {
  if (!item.actions?.length) {
    return null
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {item.actions.map((action) => {
        const actionKey = `${item.kind}:${item.id}:${action.kind}:${action.nextStage ?? ''}`

        return (
          <Button
            key={actionKey}
            type="button"
            size="sm"
            variant="outline"
            className="h-7 rounded-lg px-2.5 text-[11px]"
            disabled={actionLoadingKey === actionKey}
            onClick={(event) => {
              event.stopPropagation()
              onAction(item, action)
            }}
          >
            {actionLoadingKey === actionKey ? 'Saving...' : action.label}
          </Button>
        )
      })}
    </div>
  )
}
