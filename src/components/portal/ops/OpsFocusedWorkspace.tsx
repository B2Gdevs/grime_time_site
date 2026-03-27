'use client'

import * as React from 'react'

import { CrmWorkspace } from '@/components/portal/crm/CrmWorkspace'
import { AssetsPanel } from '@/components/portal/command-center/assets-panel'
import { CommandCenterDetailPanel } from '@/components/portal/command-center/detail-panel'
import { MilestonesPanel } from '@/components/portal/command-center/milestones-panel'
import { ScorecardPanel } from '@/components/portal/command-center/scorecard-panel'
import { TodayBoardPanel } from '@/components/portal/command-center/today-panel'
import type { DetailState, OpsCommandCenterProps } from '@/components/portal/command-center/types'
import { OpsSectionRail } from '@/components/portal/ops/OpsSectionRail'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getOpsSectionMeta, type OpsSectionId } from '@/lib/ops/uiMeta'

type Props = OpsCommandCenterProps & {
  activeSection: OpsSectionId
}

function defaultDetailForSection(activeSection: OpsSectionId): DetailState {
  const meta = getOpsSectionMeta(activeSection)

  return {
    body: meta.defaultDetailBody,
    description: meta.defaultDetailDescription,
    title: meta.pageTitle,
  }
}

function ActiveSectionPanel({
  activeSection,
  props,
  setDetail,
}: {
  activeSection: OpsSectionId
  props: OpsCommandCenterProps
  setDetail: (value: DetailState) => void
}) {
  switch (activeSection) {
    case 'assets':
      return <AssetsPanel assetLadderItems={props.assetLadderItems} setDetail={setDetail} />
    case 'crm':
      return <CrmWorkspace initialData={props.crmWorkspace} setDetail={setDetail} />
    case 'milestones':
      return <MilestonesPanel growthMilestones={props.growthMilestones} setDetail={setDetail} />
    case 'scorecard':
      return (
        <ScorecardPanel
          liabilityItems={props.liabilityItems}
          mergedScorecard={props.mergedScorecard}
          scorecardTooltipMap={props.scorecardTooltipMap}
          setDetail={setDetail}
        />
      )
    case 'today':
    default:
      return <TodayBoardPanel setDetail={setDetail} />
  }
}

export function OpsFocusedWorkspace({ activeSection, ...props }: Props) {
  const [detail, setDetail] = React.useState<DetailState>(() => defaultDetailForSection(activeSection))

  React.useEffect(() => {
    setDetail(defaultDetailForSection(activeSection))
  }, [activeSection])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="@container/main portal-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain py-4 md:py-6">
        <TooltipProvider delayDuration={200}>
          <div className="grid gap-4 px-4 lg:px-6 xl:grid-cols-[20rem_minmax(0,1fr)_22rem]">
            <OpsSectionRail activeSection={activeSection} />

            <div className="min-w-0">
              <ActiveSectionPanel activeSection={activeSection} props={props} setDetail={setDetail} />
            </div>

            <Card className="h-fit min-w-0 xl:sticky xl:top-[var(--portal-sticky-top)]">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Section detail</CardTitle>
                <CardDescription>
                  The selected context stays pinned here while the active ops page remains stable.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <CommandCenterDetailPanel detail={detail} setDetail={setDetail} />
              </CardContent>
            </Card>
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
}
