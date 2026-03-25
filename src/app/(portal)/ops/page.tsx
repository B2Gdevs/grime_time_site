import { redirect } from 'next/navigation'

import config from '@payload-config'
import { getPayload, type Where } from 'payload'

import { AdminDashboardView } from '@/components/portal/AdminDashboardView'
import type { CrmSyncBannerState } from '@/components/portal/CrmSyncBanner'
import type { SectionCardItem } from '@/components/section-cards'
import { getCurrentPayloadUser, userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { getCrmRuntimeState } from '@/lib/crm'
import { hubSpotTokenConfigured } from '@/lib/hubspot/accessToken'
import {
  formatCurrencyUsd,
  formatPipelineAmount,
  hubSpotHealthCheck,
  hubSpotOpenPipelineSummary,
} from '@/lib/hubspot/opsClient'
import { mergeScorecardRows } from '@/lib/ops/mergeScorecard'
import type {
  OpsAssetLadderRow,
  OpsGrowthMilestoneRow,
  OpsLiabilityRow,
  OpsMergedScorecardRow,
} from '@/lib/ops/opsDashboardTypes'
import { quotesInternalEnabled } from '@/utilities/quotesAccess'

import type {
  GrowthMilestone,
  InternalOpsSetting,
  OpsAssetLadderItem,
  OpsLiabilityItem,
  OpsScorecardRow,
} from '@/payload-types'

const OPS_TARGETS_FALLBACK = {
  chartDisclaimer:
    'Illustrative sample trend for layout only — connect real accounting or CRM data in a later phase.',
  mrrTargetDisplay: '$1.8k',
  projectedRevenueDisplay: '$13.6k',
} as const

function formatManualScorecardValue(name: string, value: number): string {
  if (['Revenue', 'Projected revenue', 'MRR', 'Gross profit', 'Average ticket'].includes(name)) {
    return formatCurrencyUsd(value)
  }

  if (['Gross margin', 'Quote win rate', 'Repeat rate'].includes(name)) {
    return `${value}%`
  }

  if (name === 'Revenue per labor hour') {
    return `${formatCurrencyUsd(value)}/hr`
  }

  return String(value)
}

function findScorecardRow(rows: OpsScorecardRow[], title: string): OpsScorecardRow | null {
  return rows.find((row) => row.title?.trim() === title) ?? null
}

function mapGrowthDoc(doc: GrowthMilestone): OpsGrowthMilestoneRow {
  return {
    id: String(doc.id),
    title: doc.title,
    trigger: doc.trigger ?? null,
    winCondition: doc.winCondition ?? null,
    sortOrder: typeof doc.sortOrder === 'number' ? doc.sortOrder : null,
  }
}

function mapAssetDoc(doc: OpsAssetLadderItem): OpsAssetLadderRow {
  return {
    id: String(doc.id),
    label: doc.label,
    buyNotes: doc.buyNotes ?? null,
    whyNotes: doc.whyNotes ?? null,
    owned: typeof doc.owned === 'boolean' ? doc.owned : null,
    sortOrder: typeof doc.sortOrder === 'number' ? doc.sortOrder : null,
  }
}

function mapLiabilityDoc(doc: OpsLiabilityItem): OpsLiabilityRow {
  return {
    id: String(doc.id),
    label: doc.label,
    notes: doc.notes ?? null,
    sortOrder: typeof doc.sortOrder === 'number' ? doc.sortOrder : null,
  }
}

export default async function OpsDashboardPage() {
  const user = await getCurrentPayloadUser()

  if (!user) {
    return null
  }

  if (!userIsAdmin(user)) {
    redirect('/dashboard')
  }

  const payload = await getPayload({ config })
  const quotesEnabled = quotesInternalEnabled()

  let chartDisclaimer: string | null = OPS_TARGETS_FALLBACK.chartDisclaimer
  let chartPipelineNote: string | null = null
  let mrrTargetDisplay: string = OPS_TARGETS_FALLBACK.mrrTargetDisplay
  let projectedRevenueDisplay: string = OPS_TARGETS_FALLBACK.projectedRevenueDisplay
  let kpiTooltipLeads: string | null = null
  let kpiTooltipQuotes: string | null = null
  let kpiTooltipProjectedRevenue: string | null = null
  let kpiTooltipMrr: string | null = null
  let scorecardKpiTooltips: InternalOpsSetting['scorecardKpiTooltips'] = null

  try {
    const ops = await payload.findGlobal({
      slug: 'internalOpsSettings',
      depth: 0,
      overrideAccess: false,
      user,
    })
    if (ops?.chartDisclaimer) chartDisclaimer = ops.chartDisclaimer
    if (ops?.chartPipelineNote) chartPipelineNote = ops.chartPipelineNote
    if (ops?.mrrTargetDisplay) mrrTargetDisplay = ops.mrrTargetDisplay
    if (ops?.projectedRevenueDisplay) projectedRevenueDisplay = ops.projectedRevenueDisplay
    if (ops?.kpiTooltipLeads) kpiTooltipLeads = ops.kpiTooltipLeads
    if (ops?.kpiTooltipQuotes) kpiTooltipQuotes = ops.kpiTooltipQuotes
    if (ops?.kpiTooltipProjectedRevenue) kpiTooltipProjectedRevenue = ops.kpiTooltipProjectedRevenue
    if (ops?.kpiTooltipMrr) kpiTooltipMrr = ops.kpiTooltipMrr
    if (ops?.scorecardKpiTooltips) scorecardKpiTooltips = ops.scorecardKpiTooltips
  } catch (err) {
    payload.logger.warn({
      err,
      msg: 'Ops dashboard: internalOpsSettings global unavailable (run payload migrate?). Using fallbacks.',
    })
  }

  const scorecardTooltipMap: Record<string, string> = {}
  for (const row of scorecardKpiTooltips ?? []) {
    if (row?.kpiName && row?.helpText) {
      scorecardTooltipMap[row.kpiName] = row.helpText
    }
  }

  let growthMilestones: OpsGrowthMilestoneRow[] = []
  let assetLadderItems: OpsAssetLadderRow[] = []
  let liabilityItems: OpsLiabilityRow[] = []
  let mergedScorecard: OpsMergedScorecardRow[] = mergeScorecardRows([])
  let scorecardRowsRaw: OpsScorecardRow[] = []

  async function loadGrowth() {
    try {
      const gm = await payload.find({
        collection: 'growth-milestones',
        depth: 0,
        limit: 200,
        overrideAccess: false,
        sort: 'sortOrder',
        user,
      })
      growthMilestones = gm.docs.map((d) => mapGrowthDoc(d as GrowthMilestone))
    } catch (err) {
      payload.logger.warn({ err, msg: 'Ops: growth-milestones load failed.' })
    }
  }

  async function loadAssets() {
    try {
      const al = await payload.find({
        collection: 'ops-asset-ladder-items',
        depth: 0,
        limit: 200,
        overrideAccess: false,
        sort: 'sortOrder',
        user,
      })
      assetLadderItems = al.docs.map((d) => mapAssetDoc(d as OpsAssetLadderItem))
    } catch (err) {
      payload.logger.warn({ err, msg: 'Ops: ops-asset-ladder-items load failed.' })
    }
  }

  async function loadLiabilities() {
    try {
      const liab = await payload.find({
        collection: 'ops-liability-items',
        depth: 0,
        limit: 200,
        overrideAccess: false,
        sort: 'sortOrder',
        user,
      })
      liabilityItems = liab.docs.map((d) => mapLiabilityDoc(d as OpsLiabilityItem))
    } catch (err) {
      payload.logger.warn({ err, msg: 'Ops: ops-liability-items load failed.' })
    }
  }

  async function loadScorecardRows() {
    try {
      const scRows = await payload.find({
        collection: 'ops-scorecard-rows',
        depth: 0,
        limit: 200,
        overrideAccess: false,
        sort: 'sortOrder',
        user,
      })
      scorecardRowsRaw = scRows.docs as OpsScorecardRow[]
      mergedScorecard = mergeScorecardRows(
        scorecardRowsRaw.map((d) => ({
          formula: d.formula,
          manualValue: d.manualValue,
          manualValueLabel: d.manualValueLabel ?? null,
          sortOrder: d.sortOrder,
          targetGuidance: d.targetGuidance ?? null,
          title: d.title,
        })),
      )
    } catch (err) {
      payload.logger.warn({ err, msg: 'Ops: ops-scorecard-rows load failed.' })
    }
  }

  await Promise.all([loadGrowth(), loadAssets(), loadLiabilities(), loadScorecardRows()])

  const [cardsBase, crmRuntime] = await Promise.all([
    Promise.all([
      safeCountDocs({
        collection: 'form-submissions',
        payload,
        user,
      }),
      quotesEnabled
        ? safeCountDocs({
            collection: 'quotes',
            payload,
            user,
          })
        : Promise.resolve({ totalDocs: 0, unavailable: false }),
      safeCountDocs({
        collection: 'users',
        payload,
        user,
        where: {
          roles: {
            in: ['customer'],
          },
        },
      }),
    ]).then(([leads, quotes, customers]) => ({ leads, quotes, customers })),
    getCrmRuntimeState(),
  ])

  let crmBannerState: CrmSyncBannerState | null = null
  let hubSpotOpsEnabled = false
  let pipelineSnapshotLabel: string | null = null
  let pipelineSnapshotValue: string | null = null
  let projectedValue = projectedRevenueDisplay
  let projectedTrend = 'Target'
  let projectedFooter =
    'Weighted pipeline target from the phase-06 scorecard — override in Internal ops targets when HubSpot is off.'

  const projectedRow = findScorecardRow(scorecardRowsRaw, 'Projected revenue')
  const mrrRow = findScorecardRow(scorecardRowsRaw, 'MRR')

  if (projectedRow?.manualValue != null && Number.isFinite(Number(projectedRow.manualValue))) {
    projectedValue = formatManualScorecardValue('Projected revenue', Number(projectedRow.manualValue))
    projectedTrend = projectedRow.manualValueLabel?.trim() || 'Scorecard'
    projectedFooter = projectedRow.targetGuidance?.trim() || projectedFooter
  }

  const hubspotActive = crmRuntime.activeProvider === 'hubspot'

  if (!hubspotActive) {
    crmBannerState = { status: 'hubspot_inactive' }
  } else if (!hubSpotTokenConfigured()) {
    crmBannerState = { status: 'no_token' }
  } else {
    const health = await hubSpotHealthCheck()
    if (!health.ok) {
      crmBannerState = { status: 'error', message: health.message }
    } else {
      hubSpotOpsEnabled = true
      const pipe = await hubSpotOpenPipelineSummary()
      if (pipe.error) {
        crmBannerState = { status: 'degraded', message: pipe.error }
      } else if (pipe.summary) {
        projectedValue = formatPipelineAmount(pipe.summary.openPipelineTotal, pipe.summary.currencyCode)
        projectedTrend = `${pipe.summary.openDealCount} open deals`
        projectedFooter =
          'Sum of amount on open deals (HubSpot search, first 100). Not probability-weighted in v1.'
        pipelineSnapshotLabel = 'Open pipeline (HubSpot sample)'
        pipelineSnapshotValue = projectedValue
      }
    }
  }

  let mrrValue = mrrTargetDisplay
  let mrrTrend = 'Climb'
  let mrrFooter = [
    cardsBase.customers.unavailable
      ? 'Customer counts are temporarily unavailable.'
      : `${cardsBase.customers.totalDocs} customer accounts exist; convert repeat work into plans.`,
    `${liabilityItems.length} liability item${liabilityItems.length === 1 ? '' : 's'} (scorecard tab).`,
  ].join(' ')

  if (mrrRow?.manualValue != null && Number.isFinite(Number(mrrRow.manualValue))) {
    mrrValue = formatManualScorecardValue('MRR', Number(mrrRow.manualValue))
    mrrTrend = mrrRow.manualValueLabel?.trim() || 'Scorecard'
    mrrFooter = mrrRow.targetGuidance?.trim() || mrrFooter
  }

  const chartDisclaimerMerged = [chartDisclaimer, hubspotActive && chartPipelineNote ? chartPipelineNote : null]
    .filter(Boolean)
    .join(' ')

  const cards: SectionCardItem[] = [
    {
      description: 'Website form submissions captured',
      footer: cardsBase.leads.unavailable
        ? 'Lead counts are temporarily unavailable.'
        : 'Stored in Payload and ready for active CRM follow-up.',
      metricTooltip: kpiTooltipLeads ?? undefined,
      title: 'Leads',
      trend: cardsBase.leads.unavailable ? 'Unavailable' : `${cardsBase.leads.totalDocs} open`,
      value: String(cardsBase.leads.totalDocs),
    },
    {
      description: 'Quotes currently in the internal workflow',
      footer: cardsBase.quotes.unavailable
        ? 'Quote counts are temporarily unavailable until the quotes schema is synced.'
        : 'Use Payload admin when you need full quote editing.',
      metricTooltip: kpiTooltipQuotes ?? undefined,
      title: 'Quotes',
      trend: cardsBase.quotes.unavailable ? 'Unavailable' : `${cardsBase.quotes.totalDocs} tracked`,
      value: String(cardsBase.quotes.totalDocs),
    },
    {
      description: hubspotActive
        ? 'Open deal amounts from HubSpot (when connected)'
        : 'Weighted pipeline target from Internal ops targets',
      footer: projectedFooter,
      metricTooltip: kpiTooltipProjectedRevenue ?? undefined,
      title: 'Projected revenue',
      trend: projectedTrend,
      value: projectedValue,
    },
    {
      description: 'Active maintenance-plan target for steadier cash flow',
      footer: mrrFooter,
      metricTooltip: kpiTooltipMrr ?? undefined,
      title: 'MRR',
      trend: mrrTrend,
      value: mrrValue,
    },
  ]

  return (
    <AdminDashboardView
      activeCrmProvider={crmRuntime.activeProvider}
      assetLadderItems={assetLadderItems}
      cards={cards}
      chartDisclaimer={chartDisclaimerMerged}
      crmBannerState={crmBannerState}
      crmProviders={crmRuntime.availableProviders}
      growthMilestones={growthMilestones}
      hubSpotOpsEnabled={hubSpotOpsEnabled}
      liabilityItems={liabilityItems}
      mergedScorecard={mergedScorecard}
      pipelineSnapshotLabel={pipelineSnapshotLabel}
      pipelineSnapshotValue={pipelineSnapshotValue}
      quotesEnabled={quotesEnabled}
      scorecardTooltipMap={scorecardTooltipMap}
    />
  )
}

async function safeCountDocs({
  collection,
  payload,
  user,
  where,
}: {
  collection: 'form-submissions' | 'quotes' | 'users'
  payload: Awaited<ReturnType<typeof getPayload>>
  user: NonNullable<Awaited<ReturnType<typeof getCurrentPayloadUser>>>
  where?: Where
}) {
  try {
    const result = await payload.count({
      collection,
      overrideAccess: false,
      user,
      where,
    })

    return {
      totalDocs: result.totalDocs,
      unavailable: false,
    }
  } catch (error) {
    payload.logger.error({
      collection,
      err: error,
      msg: `Portal dashboard count failed for ${collection}`,
    })

    return {
      totalDocs: 0,
      unavailable: true,
    }
  }
}
