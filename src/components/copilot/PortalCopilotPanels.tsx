'use client'

import { RouteIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CopilotInsightBundle, CopilotRagHit, CopilotTourSuggestion } from '@/lib/ai'
import type { CrmWorkspaceQueueItem } from '@/lib/crm/workspace'

export type CopilotBundle = {
  insights: CopilotInsightBundle
  query: string
  sources: CopilotRagHit[]
}

export function buildCopilotTourHref(tour: CopilotTourSuggestion): string {
  const params = new URLSearchParams()
  if (tour.opsTab) {
    params.set('tab', tour.opsTab)
  }
  params.set('tour', tour.id)
  const query = params.toString()
  return query ? `${tour.path}?${query}` : tour.path
}

export function RecordList({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel: string
  items: CrmWorkspaceQueueItem[]
  title: string
}) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed bg-background/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{emptyLabel}</CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-background/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <a
            key={`${title}-${item.kind}-${item.id}`}
            className="block rounded-xl border bg-background px-3 py-3 transition hover:border-primary/40 hover:bg-accent/40"
            href={item.href}
            rel="noreferrer"
            target="_blank"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
              {item.stale ? <Badge variant="destructive">Stale</Badge> : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              {item.priorityLabel ? <span>{item.priorityLabel}</span> : null}
              <span>{item.statusLabel}</span>
              {item.meta.slice(0, 2).map((meta) => (
                <span key={`${item.id}-${meta}`}>{meta}</span>
              ))}
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  )
}

export function TourList({ tours }: { tours: CopilotTourSuggestion[] }) {
  const pathname = usePathname()
  const router = useRouter()

  if (tours.length === 0) return null

  const launch = (tour: CopilotTourSuggestion) => {
    const target = buildCopilotTourHref(tour)
    if (pathname === tour.path) {
      router.push(target)
      return
    }
    router.push(target)
  }

  return (
    <Card className="bg-background/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Recommended tours</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tours.map((tour) => (
          <button
            key={tour.id}
            className="flex w-full items-start justify-between rounded-xl border bg-background px-3 py-3 text-left transition hover:border-primary/40 hover:bg-accent/40"
            onClick={() => launch(tour)}
            type="button"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{tour.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tour.blurb}</p>
            </div>
            <RouteIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </CardContent>
    </Card>
  )
}

export function SourcesList({ sources }: { sources: CopilotRagHit[] }) {
  if (sources.length === 0) return null

  return (
    <Card className="bg-background/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Internal doc sources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sources.map((source) => (
          <div key={source.chunkId} className="rounded-xl border bg-background px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{source.title}</p>
                {source.heading ? <p className="mt-1 text-xs text-muted-foreground">{source.heading}</p> : null}
              </div>
              <Badge variant="outline">{Math.round(source.score * 100)}%</Badge>
            </div>
            <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{source.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
