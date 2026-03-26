import Link from 'next/link'

import { FileTextIcon, ReceiptTextIcon, Settings2Icon, ShieldIcon } from 'lucide-react'

import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { DataTable } from '@/components/data-table'
import { SectionCards, type SectionCardItem } from '@/components/section-cards'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CrmWorkspaceData } from '@/lib/crm/workspace'
import type {
  OpsAssetLadderRow,
  OpsGrowthMilestoneRow,
  OpsLiabilityRow,
  OpsMergedScorecardRow,
} from '@/lib/ops/opsDashboardTypes'

export function AdminDashboardView({
  assetLadderItems,
  cards,
  chartDisclaimer,
  crmWorkspace,
  growthMilestones,
  liabilityItems,
  mergedScorecard,
  pipelineSnapshotLabel,
  pipelineSnapshotValue,
  quotesEnabled,
  scorecardTooltipMap,
}: {
  assetLadderItems: OpsAssetLadderRow[]
  cards: SectionCardItem[]
  chartDisclaimer?: string | null
  crmWorkspace: CrmWorkspaceData
  growthMilestones: OpsGrowthMilestoneRow[]
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
        description="Internal command center for CRM, quotes, schedules, scorecards, and growth decisions."
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className="@container/main portal-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto overscroll-contain py-4 md:py-6"
          data-portal-scroll=""
        >
          <SectionCards items={cards} />

          <DataTable
            assetLadderItems={assetLadderItems}
            crmWorkspace={crmWorkspace}
            growthMilestones={growthMilestones}
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
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Operator panel</CardTitle>
                  <CardDescription>CRM, quote, automation, and admin controls.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button asChild className="justify-start">
                    <Link href="/admin/collections/leads">
                      <ReceiptTextIcon className="size-4" />
                      Open leads
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin/collections/crm-tasks">
                      <ReceiptTextIcon className="size-4" />
                      Open CRM tasks
                    </Link>
                  </Button>
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
                    <Link href="/admin/collections/opportunities">
                      <FileTextIcon className="size-4" />
                      Open opportunities
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link href="/admin/collections/crm-sequences">
                      <FileTextIcon className="size-4" />
                      Open sequences
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
