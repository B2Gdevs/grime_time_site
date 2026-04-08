'use client'

import { Badge } from '@/components/ui/badge'
import { adminPanelChrome } from '@/components/admin-impersonation/adminPanelChrome'
import type { ValidationSummary } from '@/components/page-composer/drawer/PageComposerDrawerPublishTypes'

export function PageComposerDrawerPublishReviewCard({ validationSummary }: { validationSummary: null | ValidationSummary }) {
  return (
    <div className={adminPanelChrome.card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className={adminPanelChrome.fieldLabel}>Publish review</div>
          <div className="mt-2 text-sm font-semibold text-foreground">
            {validationSummary?.pageStatus === 'published' ? 'Published page with active draft edits' : 'Draft page'}
          </div>
        </div>
        <Badge variant={validationSummary?.issues.length ? 'outline' : 'secondary'}>
          {validationSummary?.issues.length || 0} validation issue{validationSummary?.issues.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {validationSummary?.issues.length ? (
        <div className="mt-4 grid gap-2">
          {validationSummary.issues.map((issue) => (
            <div
              className={`rounded-2xl border px-3 py-3 text-sm ${
                issue.tone === 'warning'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100'
                  : 'border-border/70 bg-background/70 text-muted-foreground'
              }`}
              key={issue.id}
            >
              {issue.blockIndex !== null ? `Block ${issue.blockIndex + 1}: ` : ''}
              {issue.message}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-sm text-muted-foreground">Validation is clear for the currently supported composer checks.</div>
      )}
    </div>
  )
}

