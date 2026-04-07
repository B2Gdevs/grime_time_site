'use client'

import { Badge } from '@/components/ui/badge'
import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import { formatComposerTimestamp } from '@/utilities/formatComposerTimestamp'
import type { PageComposerDocument } from '@/lib/pages/pageComposer'

export function PageComposerDrawerPublishOverviewCard({ draftPage }: { draftPage: PageComposerDocument }) {
  return (
    <div className={adminPanelChrome.card}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-foreground">{draftPage.title}</div>
        <Badge variant="outline">{draftPage._status || 'draft'}</Badge>
        <Badge variant="secondary">{draftPage.visibility || 'public'}</Badge>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Updated {formatComposerTimestamp(draftPage.updatedAt)} · Published {formatComposerTimestamp(draftPage.publishedAt)}
      </div>
    </div>
  )
}
