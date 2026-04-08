'use client'

import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import type { SharedSectionRecord } from '@/lib/pages/sharedSections'

export function PageComposerDrawerSharedSectionCard({
  blockLibraryMode,
  insertSharedSection,
  item,
  openSharedSectionSourceEditor,
}: {
  blockLibraryMode: 'insert' | 'replace'
  insertSharedSection: (args: { item: SharedSectionRecord; mode: 'detached' | 'linked' }) => void
  item: SharedSectionRecord
  openSharedSectionSourceEditor: (id: number) => void
}) {
  return (
    <div className={adminPanelChrome.card}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-foreground">{item.name}</div>
        <Badge variant={item.status === 'published' ? 'secondary' : 'outline'}>{item.status}</Badge>
        <Badge variant="outline">{item.category}</Badge>
        <Badge variant="outline">v{item.currentVersion}</Badge>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        {item.description || 'Shared section source ready for linked reuse.'}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {item.tags.length ? (
          item.tags.map((tag) => (
            <Badge key={`${item.id}-${tag}`} variant="secondary">
              {tag}
            </Badge>
          ))
        ) : (
          <Badge variant="outline">No tags</Badge>
        )}
        <Badge variant="outline">
          {item.usageCount} {item.usageCount === 1 ? 'page' : 'pages'}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => insertSharedSection({ item, mode: 'linked' })} size="sm" type="button" variant="outline">
          {blockLibraryMode === 'replace' ? 'Replace with linked' : 'Insert linked'}
        </Button>
        <Button onClick={() => insertSharedSection({ item, mode: 'detached' })} size="sm" type="button">
          {blockLibraryMode === 'replace' ? 'Replace with detached copy' : 'Insert detached copy'}
        </Button>
        <Button onClick={() => openSharedSectionSourceEditor(item.id)} size="sm" type="button" variant="ghost">
          Edit source
        </Button>
      </div>
    </div>
  )
}
