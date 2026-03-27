import Link from 'next/link'

import { ArrowLeftIcon } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { type OpsDashboardData } from '@/lib/ops/loaders/loadOpsDashboardData'
import { buildOpsTabUrl } from '@/lib/ops/opsCommandCenterTabs'
import { getOpsSectionMeta, type OpsSectionId } from '@/lib/ops/uiMeta'

import { OpsFocusedWorkspace } from './OpsFocusedWorkspace'

export function OpsSectionPage({
  activeSection,
  data,
}: {
  activeSection: OpsSectionId
  data: OpsDashboardData
}) {
  const meta = getOpsSectionMeta(activeSection)

  return (
    <>
      <SiteHeader
        title={meta.pageTitle}
        description={meta.pageDescription}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href={buildOpsTabUrl('', activeSection)}>
              <ArrowLeftIcon className="size-4" />
              Back to hub
            </Link>
          </Button>
        }
      />
      <OpsFocusedWorkspace
        activeSection={activeSection}
        assetLadderItems={data.assetLadderItems}
        crmWorkspace={data.crmWorkspace}
        growthMilestones={data.growthMilestones}
        liabilityItems={data.liabilityItems}
        mergedScorecard={data.mergedScorecard}
        scorecardTooltipMap={data.scorecardTooltipMap}
      />
    </>
  )
}
