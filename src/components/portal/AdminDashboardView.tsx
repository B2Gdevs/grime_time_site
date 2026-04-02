import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { SectionCards, type SectionCardItem } from '@/components/section-cards'
import { SiteHeader } from '@/components/site-header'
import type { OpsDashboardData } from '@/lib/ops/loaders/loadOpsDashboardData'
import type { OpsChartTrendPoint } from '@/lib/ops/loadOpsChartTrend'

export function AdminDashboardView({
  cards,
  chartDisclaimer,
  chartMetricSummaries,
  chartTrend,
  chartTrendIsLive,
  pipelineSnapshotLabel,
  pipelineSnapshotValue,
}: {
  cards: SectionCardItem[]
  chartDisclaimer?: string | null
  chartMetricSummaries: OpsDashboardData['chartMetricSummaries']
  chartTrend?: OpsChartTrendPoint[] | null
  chartTrendIsLive?: boolean
  pipelineSnapshotLabel?: string | null
  pipelineSnapshotValue?: string | null
}) {
  return (
    <>
      <SiteHeader
        title="Ops dashboard"
        description="KPI scan and chart view for current operations."
      />
      <div className="@container/main flex flex-col gap-6 py-4 md:py-6">
        <div data-tour="portal-kpi-cards">
          <SectionCards items={cards} />
        </div>

        <div className="grid min-w-0 gap-4 px-4 lg:px-6">
          <ChartAreaInteractive
            chartTrend={chartTrend ?? null}
            chartTrendIsLive={chartTrendIsLive}
            disclaimer={chartDisclaimer}
            metricSummaries={chartMetricSummaries}
            pipelineSnapshotLabel={pipelineSnapshotLabel}
            pipelineSnapshotValue={pipelineSnapshotValue}
          />
        </div>
      </div>
    </>
  )
}
