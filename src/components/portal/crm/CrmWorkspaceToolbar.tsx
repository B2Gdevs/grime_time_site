import { SearchIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { CrmWorkspaceOwnerScope } from '@/lib/crm/workspace'

export function CrmWorkspaceToolbar({
  commercialOnly,
  onCommercialOnlyChange,
  onOwnerScopeChange,
  onSearchChange,
  searchValue,
  staleOnly,
  onStaleOnlyChange,
  ownerScope,
}: {
  commercialOnly: boolean
  onCommercialOnlyChange: (value: boolean) => void
  onOwnerScopeChange: (value: CrmWorkspaceOwnerScope) => void
  onSearchChange: (value: string) => void
  onStaleOnlyChange: (value: boolean) => void
  ownerScope: CrmWorkspaceOwnerScope
  searchValue: string
  staleOnly: boolean
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
      <div className="relative min-w-0">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search leads, companies, contacts, tasks, or automation"
          className="h-9 pl-9 text-sm"
          aria-label="Search CRM workspace"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <ToggleGroup
          type="single"
          value={ownerScope}
          onValueChange={(value) => {
            if (value === 'all' || value === 'mine' || value === 'unassigned') {
              onOwnerScopeChange(value)
            }
          }}
          className="justify-start rounded-xl border bg-muted/30 p-1"
        >
          <ToggleGroupItem value="all" variant="outline" size="sm" className="rounded-lg border-0 px-3 text-xs">
            All owners
          </ToggleGroupItem>
          <ToggleGroupItem value="mine" variant="outline" size="sm" className="rounded-lg border-0 px-3 text-xs">
            Mine
          </ToggleGroupItem>
          <ToggleGroupItem
            value="unassigned"
            variant="outline"
            size="sm"
            className="rounded-lg border-0 px-3 text-xs"
          >
            Unassigned
          </ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup
          type="single"
          value={staleOnly ? 'stale' : 'all'}
          onValueChange={(value) => {
            onStaleOnlyChange(value === 'stale')
          }}
          className="justify-start rounded-xl border bg-muted/30 p-1"
        >
          <ToggleGroupItem value="all" variant="outline" size="sm" className="rounded-lg border-0 px-3 text-xs">
            All
          </ToggleGroupItem>
          <ToggleGroupItem value="stale" variant="outline" size="sm" className="rounded-lg border-0 px-3 text-xs">
            Stale only
          </ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup
          type="single"
          value={commercialOnly ? 'commercial' : 'all'}
          onValueChange={(value) => {
            onCommercialOnlyChange(value === 'commercial')
          }}
          className="justify-start rounded-xl border bg-muted/30 p-1"
        >
          <ToggleGroupItem value="all" variant="outline" size="sm" className="rounded-lg border-0 px-3 text-xs">
            All accounts
          </ToggleGroupItem>
          <ToggleGroupItem
            value="commercial"
            variant="outline"
            size="sm"
            className="rounded-lg border-0 px-3 text-xs"
          >
            Commercial
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}
