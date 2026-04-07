'use client'

import { Badge } from '@/components/ui/badge'
import type { PageComposerSectionSummary } from '@/lib/pages/pageComposer'

export function CanvasSectionSummaryBadges({
  dirty,
  sectionBadgeLabel,
  sectionSummary,
}: {
  dirty: boolean
  sectionBadgeLabel: string
  sectionSummary: PageComposerSectionSummary
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-3 top-3 z-20 flex min-h-10 items-start gap-3 rounded-[1.2rem] border border-border/70 bg-background/94 px-3 py-2 shadow-lg opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-within:opacity-100"
      data-page-composer-interactive="true"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant="secondary">{sectionBadgeLabel}</Badge>
        <Badge variant="outline">{sectionSummary.blockType}</Badge>
        {sectionSummary.variant ? <Badge variant="outline">{sectionSummary.variant}</Badge> : null}
        {sectionSummary.badges
          .filter((badge) => badge !== sectionSummary.variant)
          .map((badge) => (
            <Badge key={`${sectionSummary.index}-${badge}`} variant={badge === 'reusable' ? 'secondary' : 'outline'}>
              {badge}
            </Badge>
          ))}
      </div>
      {dirty ? <Badge>Unsaved</Badge> : null}
    </div>
  )
}
