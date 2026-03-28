import Link from 'next/link'

import { ArrowRightIcon } from 'lucide-react'

import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { SectionCards, type SectionCardItem } from '@/components/section-cards'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import type { OpsChartTrendPoint } from '@/lib/ops/loadOpsChartTrend'

export function AdminDashboardView({
  cards,
  chartDisclaimer,
  chartTrend,
  chartTrendIsLive,
  pipelineSnapshotLabel,
  pipelineSnapshotValue,
}: {
  cards: SectionCardItem[]
  chartDisclaimer?: string | null
  chartTrend?: OpsChartTrendPoint[] | null
  chartTrendIsLive?: boolean
  pipelineSnapshotLabel?: string | null
  pipelineSnapshotValue?: string | null
}) {
  return (
    <>
      <SiteHeader
        title="Ops dashboard"
        description="KPI scan and chart view for current operations. Use Ops workspace for live queues, billing follow-up, and day-of work."
        actions={
          <Button asChild size="sm">
            <Link href="/ops/workspace">
              Open ops workspace
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className="@container/main portal-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto overscroll-contain py-4 md:py-6"
          data-portal-scroll=""
        >
          <div data-tour="portal-kpi-cards">
            <SectionCards items={cards} />
          </div>

          <div className="grid min-w-0 gap-4 px-4 lg:px-6">
            <ChartAreaInteractive
              chartTrend={chartTrend ?? null}
              chartTrendIsLive={chartTrendIsLive}
              disclaimer={chartDisclaimer}
              pipelineSnapshotLabel={pipelineSnapshotLabel}
              pipelineSnapshotValue={pipelineSnapshotValue}
            />
          </div>
        </div>
      </div>
    </>
  )
}
