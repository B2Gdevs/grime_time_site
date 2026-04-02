import { redirect } from 'next/navigation'

import { AdminDashboardView } from '@/components/portal/AdminDashboardView'
import { loadOpsRouteData } from '@/lib/ops/loaders/loadOpsRouteData'
import { parseOpsTabQuery } from '@/lib/ops/opsCommandCenterTabs'

type OpsPageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function OpsDashboardPage({ searchParams }: OpsPageProps) {
  const sp = await searchParams
  const initialCommandCenterTab = parseOpsTabQuery(sp.tab)

  if (initialCommandCenterTab) {
    redirect(`/ops/workspace?tab=${initialCommandCenterTab}`)
  }

  const { data } = await loadOpsRouteData()

  return (
    <AdminDashboardView
      cards={data.cards}
      chartDisclaimer={data.chartDisclaimer}
      chartMetricSummaries={data.chartMetricSummaries}
      chartTrend={data.chartTrend}
      chartTrendIsLive={data.chartTrendIsLive}
      pipelineSnapshotLabel={data.pipelineSnapshotLabel}
      pipelineSnapshotValue={data.pipelineSnapshotValue}
    />
  )
}
