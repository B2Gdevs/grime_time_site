import Link from 'next/link'

import { ArrowRightIcon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utilities/ui'
import type { OpsCommandCenterTabId } from '@/lib/ops/opsCommandCenterTabs'
import type { OpsDashboardDutySection } from '@/lib/ops/opsDashboardTypes'
import { OPS_SECTION_IDS, getOpsSectionMeta } from '@/lib/ops/uiMeta'

type Props = {
  dutySections: OpsDashboardDutySection[]
  initialCommandCenterTab?: OpsCommandCenterTabId
}

export function OpsDutyBoard({ dutySections, initialCommandCenterTab }: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <div className="grid gap-4">
        {dutySections.map((section) => (
          <Card key={section.id}>
            <CardHeader className="pb-3">
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {section.items.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
                  Nothing urgent is queued here right now.
                </div>
              ) : (
                section.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      'rounded-xl border px-4 py-3 transition-colors hover:bg-muted/40',
                      item.tone === 'warning' && 'border-amber-500/30 bg-amber-500/5',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{item.title}</div>
                        <div className="truncate text-sm text-muted-foreground">{item.subtitle}</div>
                        <div className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {item.meta}
                        </div>
                      </div>
                      <ArrowRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    </div>
                  </Link>
                ))
              )}
              {section.rhythmSummary ? (
                <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{section.roleSummary || 'Duty coverage'}:</span>{' '}
                  {section.rhythmSummary}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Focused workspaces</CardTitle>
          <CardDescription>Use the hub for triage, then switch into the route that owns the dense work.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {OPS_SECTION_IDS.map((sectionId) => {
            const section = getOpsSectionMeta(sectionId)
            const Icon = section.icon
            const active = initialCommandCenterTab === sectionId

            return (
              <Link
                key={sectionId}
                href={section.href}
                className={cn(
                  'rounded-xl border px-4 py-3 transition-colors hover:bg-muted/40',
                  active && 'border-primary/40 bg-primary/5',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg border bg-background p-2">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium">{section.pageTitle}</div>
                    <div className="text-sm text-muted-foreground">{section.pageDescription}</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
