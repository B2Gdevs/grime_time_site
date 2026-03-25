import { redirect } from 'next/navigation'

import config from '@payload-config'
import { getPayload, type Where } from 'payload'

import { AdminDashboardView } from '@/components/portal/AdminDashboardView'
import type { SectionCardItem } from '@/components/section-cards'
import { getCurrentPayloadUser, userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
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
  Quote,
  ServicePlan,
} from '@/payload-types'

const OPS_TARGETS_FALLBACK: {
  chartDisclaimer: string
  mrrTargetDisplay: string
  projectedRevenueDisplay: string
} = {
  chartDisclaimer:
    'Illustrative sample trend for layout only. Connect real accounting and internal CRM time series in a later phase.',
  mrrTargetDisplay: '$1.8k',
  projectedRevenueDisplay: '$13.6k',
}

const QUOTE_PROJECTION_WEIGHTS = {
  accepted: 1,
  sent: 0.6,
} as const

type QuoteProjectionMetrics = {
  acceptedQuoteCount: number
  openQuoteCount: number
  sentQuoteCount: number
  weightedRevenue: number
}

type ServicePlanMetrics = {
  activePlanCount: number
  annualRecurringRevenue: number
  monthlyRecurringRevenue: number
}

function formatCurrencyUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

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
  let mrrTargetDisplay = OPS_TARGETS_FALLBACK.mrrTargetDisplay
  let projectedRevenueDisplay = OPS_TARGETS_FALLBACK.projectedRevenueDisplay
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

  const [cardsBase, quoteProjection, servicePlanMetrics] = await Promise.all([
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
    quotesEnabled
      ? loadQuoteProjection({
          payload,
          user,
        })
      : Promise.resolve(null),
    loadServicePlanMetrics({
      payload,
      user,
    }),
  ])

  const projectedRow = findScorecardRow(scorecardRowsRaw, 'Projected revenue')
  const mrrRow = findScorecardRow(scorecardRowsRaw, 'MRR')

  let pipelineSnapshotLabel: string | null = null
  let pipelineSnapshotValue: string | null = null

  let projectedValue = projectedRevenueDisplay
  let projectedTrend = 'Target'
  let projectedFooter =
    'Set the projected revenue target in Internal ops targets or scorecard rows until more quote data is available.'

  if (projectedRow?.manualValue != null && Number.isFinite(Number(projectedRow.manualValue))) {
    projectedValue = formatManualScorecardValue('Projected revenue', Number(projectedRow.manualValue))
    projectedTrend = projectedRow.manualValueLabel?.trim() || 'Scorecard'
    projectedFooter = projectedRow.targetGuidance?.trim() || projectedFooter
  }

  if (quoteProjection && quoteProjection.openQuoteCount > 0) {
    projectedValue = formatCurrencyUsd(quoteProjection.weightedRevenue)
    projectedTrend = `${quoteProjection.openQuoteCount} open quotes`
    projectedFooter = [
      'Accepted quotes count at 100%; sent quotes count at 60% for the internal weighted pipeline.',
      projectedRow?.targetGuidance?.trim() ? `Target: ${projectedRow.targetGuidance.trim()}` : null,
    ]
      .filter(Boolean)
      .join(' ')
    pipelineSnapshotLabel = 'Internal pipeline mix'
    pipelineSnapshotValue = `${quoteProjection.acceptedQuoteCount} accepted, ${quoteProjection.sentQuoteCount} sent`
  }

  let mrrValue = mrrTargetDisplay
  let mrrTrend = 'Target'
  let mrrFooter = [
    cardsBase.customers.unavailable
      ? 'Customer counts are temporarily unavailable.'
      : `${cardsBase.customers.totalDocs} customer accounts exist; convert repeat work into plans.`,
    `${liabilityItems.length} liability item${liabilityItems.length === 1 ? '' : 's'} tracked in the scorecard tab.`,
  ].join(' ')

  if (mrrRow?.manualValue != null && Number.isFinite(Number(mrrRow.manualValue))) {
    mrrValue = formatManualScorecardValue('MRR', Number(mrrRow.manualValue))
    mrrTrend = mrrRow.manualValueLabel?.trim() || 'Scorecard'
    mrrFooter = mrrRow.targetGuidance?.trim() || mrrFooter
  }

  if (servicePlanMetrics && servicePlanMetrics.activePlanCount > 0) {
    mrrValue = formatCurrencyUsd(servicePlanMetrics.monthlyRecurringRevenue)
    mrrTrend = `${servicePlanMetrics.activePlanCount} active plans`
    mrrFooter = [
      `${formatCurrencyUsd(servicePlanMetrics.annualRecurringRevenue)} in annual recurring plan value is active now.`,
      mrrRow?.targetGuidance?.trim() ? `Target: ${mrrRow.targetGuidance.trim()}` : null,
    ]
      .filter(Boolean)
      .join(' ')
  }

  const chartDisclaimerMerged = [
    chartDisclaimer,
    quoteProjection && quoteProjection.openQuoteCount > 0 && chartPipelineNote ? chartPipelineNote : null,
  ]
    .filter(Boolean)
    .join(' ')

  const cards: SectionCardItem[] = [
    {
      description: 'Website form submissions captured',
      footer: cardsBase.leads.unavailable
        ? 'Lead counts are temporarily unavailable.'
        : 'Stored in Payload and ready for the internal follow-up queue.',
      metricTooltip: kpiTooltipLeads ?? undefined,
      title: 'Leads',
      trend: cardsBase.leads.unavailable ? 'Unavailable' : `${cardsBase.leads.totalDocs} tracked`,
      value: String(cardsBase.leads.totalDocs),
    },
    {
      description: 'Quotes currently in the internal workflow',
      footer: cardsBase.quotes.unavailable
        ? 'Quote counts are temporarily unavailable until the quotes schema is synced.'
        : 'Use Payload admin for full quote editing and internal opportunity review.',
      metricTooltip: kpiTooltipQuotes ?? undefined,
      title: 'Quotes',
      trend: cardsBase.quotes.unavailable ? 'Unavailable' : `${cardsBase.quotes.totalDocs} tracked`,
      value: String(cardsBase.quotes.totalDocs),
    },
    {
      description: 'Weighted from accepted and sent quotes stored in Payload',
      footer: projectedFooter,
      metricTooltip: kpiTooltipProjectedRevenue ?? undefined,
      title: 'Projected revenue',
      trend: projectedTrend,
      value: projectedValue,
    },
    {
      description: 'Active maintenance-plan revenue derived from service plans',
      footer: mrrFooter,
      metricTooltip: kpiTooltipMrr ?? undefined,
      title: 'MRR',
      trend: mrrTrend,
      value: mrrValue,
    },
  ]

  return (
    <AdminDashboardView
      assetLadderItems={assetLadderItems}
      cards={cards}
      chartDisclaimer={chartDisclaimerMerged}
      growthMilestones={growthMilestones}
      liabilityItems={liabilityItems}
      mergedScorecard={mergedScorecard}
      pipelineSnapshotLabel={pipelineSnapshotLabel}
      pipelineSnapshotValue={pipelineSnapshotValue}
      quotesEnabled={quotesEnabled}
      scorecardTooltipMap={scorecardTooltipMap}
    />
  )
}

async function loadQuoteProjection({
  payload,
  user,
}: {
  payload: Awaited<ReturnType<typeof getPayload>>
  user: NonNullable<Awaited<ReturnType<typeof getCurrentPayloadUser>>>
}): Promise<QuoteProjectionMetrics | null> {
  try {
    const result = await payload.find({
      collection: 'quotes',
      depth: 0,
      limit: 200,
      overrideAccess: false,
      sort: '-updatedAt',
      user,
      where: {
        status: {
          in: ['accepted', 'sent'],
        },
      },
    })

    let acceptedQuoteCount = 0
    let sentQuoteCount = 0
    let weightedRevenue = 0

    for (const quote of result.docs as Quote[]) {
      const total = typeof quote.pricing?.total === 'number' ? quote.pricing.total : 0

      if (quote.status === 'accepted') {
        acceptedQuoteCount += 1
        weightedRevenue += total * QUOTE_PROJECTION_WEIGHTS.accepted
      }

      if (quote.status === 'sent') {
        sentQuoteCount += 1
        weightedRevenue += total * QUOTE_PROJECTION_WEIGHTS.sent
      }
    }

    return {
      acceptedQuoteCount,
      openQuoteCount: acceptedQuoteCount + sentQuoteCount,
      sentQuoteCount,
      weightedRevenue,
    }
  } catch (error) {
    payload.logger.warn({
      err: error,
      msg: 'Ops dashboard quote projection load failed.',
    })

    return null
  }
}

async function loadServicePlanMetrics({
  payload,
  user,
}: {
  payload: Awaited<ReturnType<typeof getPayload>>
  user: NonNullable<Awaited<ReturnType<typeof getCurrentPayloadUser>>>
}): Promise<ServicePlanMetrics | null> {
  try {
    const result = await payload.find({
      collection: 'service-plans',
      depth: 0,
      limit: 200,
      overrideAccess: false,
      sort: '-updatedAt',
      user,
      where: {
        status: {
          equals: 'active',
        },
      },
    })

    let annualRecurringRevenue = 0
    for (const plan of result.docs as ServicePlan[]) {
      if (typeof plan.annualPlanAmount === 'number') {
        annualRecurringRevenue += plan.annualPlanAmount
      }
    }

    return {
      activePlanCount: result.docs.length,
      annualRecurringRevenue,
      monthlyRecurringRevenue: annualRecurringRevenue / 12,
    }
  } catch (error) {
    payload.logger.warn({
      err: error,
      msg: 'Ops dashboard service-plan metrics load failed.',
    })

    return null
  }
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
