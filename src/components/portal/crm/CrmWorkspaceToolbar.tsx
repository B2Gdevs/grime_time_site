import { SearchIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export function CrmWorkspaceToolbar({
  onSearchChange,
  searchValue,
  staleOnly,
  onStaleOnlyChange,
}: {
  onSearchChange: (value: string) => void
  onStaleOnlyChange: (value: boolean) => void
  searchValue: string
  staleOnly: boolean
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
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

      <ToggleGroup
        type="single"
        value={staleOnly ? 'stale' : 'all'}
        onValueChange={(value) => onStaleOnlyChange(value === 'stale')}
        className="justify-start rounded-xl border bg-muted/30 p-1"
      >
        <ToggleGroupItem value="all" variant="outline" size="sm" className="rounded-lg border-0 px-3 text-xs">
          All
        </ToggleGroupItem>
        <ToggleGroupItem value="stale" variant="outline" size="sm" className="rounded-lg border-0 px-3 text-xs">
          Stale only
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
