import Link from 'next/link'

import { FileTextIcon, ReceiptTextIcon, Settings2Icon, ShieldIcon } from 'lucide-react'

import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { CrmProviderCard } from '@/components/portal/CrmProviderCard'
import type { CrmSyncBannerState } from '@/components/portal/CrmSyncBanner'
import { CrmSyncBanner } from '@/components/portal/CrmSyncBanner'
import { DataTable } from '@/components/data-table'
import { SectionCards, type SectionCardItem } from '@/components/section-cards'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  OpsAssetLadderRow,
  OpsGrowthMilestoneRow,
  OpsLiabilityRow,
  OpsMergedScorecardRow,
} from '@/lib/ops/opsDashboardTypes'
import type { CrmProviderSlug, CrmProviderSummary } from '@/lib/crm/types'

export function AdminDashboardView({
  activeCrmProvider,
  assetLadderItems,
  cards,
  chartDisclaimer,
  crmBannerState,
  crmProviders,
  growthMilestones,
  hubSpotOpsEnabled,
  liabilityItems,
  mergedScorecard,
  pipelineSnapshotLabel,
  pipelineSnapshotValue,
  quotesEnabled,
  scorecardTooltipMap,
}: {
  activeCrmProvider: CrmProviderSlug | null
  assetLadderItems: OpsAssetLadderRow[]
  cards: SectionCardItem[]
  chartDisclaimer?: string | null
  crmBannerState: CrmSyncBannerState | null
  crmProviders: CrmProviderSummary[]
  growthMilestones: OpsGrowthMilestoneRow[]
  hubSpotOpsEnabled: boolean
  liabilityItems: OpsLiabilityRow[]
  mergedScorecard: OpsMergedScorecardRow[]
  pipelineSnapshotLabel?: string | null
  pipelineSnapshotValue?: string | null
  quotesEnabled: boolean
  scorecardTooltipMap: Record<string, string>
}) {
  return (
    <>
      <SiteHeader
        title="Ops dashboard"
        description="Internal command center for leads, quotes, scorecards, and growth decisions."
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className="@container/main portal-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto overscroll-contain py-4 md:py-6"
          data-portal-scroll=""
        >
          <CrmSyncBanner state={crmBannerState} />

          <SectionCards items={cards} />

          <DataTable
            assetLadderItems={assetLadderItems}
            growthMilestones={growthMilestones}
            hubSpotOpsEnabled={hubSpotOpsEnabled}
            liabilityItems={liabilityItems}
            mergedScorecard={mergedScorecard}
            scorecardTooltipMap={scorecardTooltipMap}
          />

          <div className="grid min-w-0 gap-4 px-4 lg:px-6 xl:grid-cols-[minmax(0,1.7fr)_22rem]">
            <ChartAreaInteractive
              disclaimer={chartDisclaimer}
              pipelineSnapshotLabel={pipelineSnapshotLabel}
              pipelineSnapshotValue={pipelineSnapshotValue}
            />

            <div className="grid gap-4">
              <CrmProviderCard activeProvider={activeCrmProvider} availableProviders={crmProviders} />

              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Operator panel</CardTitle>
                  <CardDescription>Quote tools, docs, and Payload admin.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {quotesEnabled ? (
                    <Button asChild className="justify-start">
                      <Link href="/admin/collections/quotes">
                        <ReceiptTextIcon className="size-4" />
                        Open quotes
                      </Link>
                    </Button>
                  ) : null}
                  <Button asChild className="justify-start">
                    <Link href="/admin/globals/quoteSettings">
                      <Settings2Icon className="size-4" />
                      Open quote settings
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/docs/quote-system-and-texas-compliance">
                      <FileTextIcon className="size-4" />
                      Open quote playbook
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/docs/business-scorecard-and-growth">
                      <FileTextIcon className="size-4" />
                      Open scorecard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin">
                      <ShieldIcon className="size-4" />
                      Open Payload admin
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
