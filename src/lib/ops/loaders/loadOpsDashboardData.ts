import { loadBillingWorkspace, type BillingWorkspaceData } from '@/lib/billing/workspace'
import type { SectionCardItem } from '@/components/section-cards'
import { isAdminUser } from '@/lib/auth/roles'
import { DEMO_EMAIL_SUFFIX } from '@/lib/demo/constants'
import { resolveDemoAccountIds } from '@/lib/demo/resolveDemoAccountIds'
import { scopeWhereForAccount } from '@/lib/demo/scopeWhere'
import { loadCrmWorkspace, type CrmWorkspaceData } from '@/lib/crm/workspace'
import { buildOpsDashboardKpiCards } from '@/lib/ops/buildOpsDashboardKpiCards'
import { loadOpsChartTrend } from '@/lib/ops/loadOpsChartTrend'
import { mergeScorecardRows } from '@/lib/ops/mergeScorecard'
import type {
  OpsAssetLadderRow,
  OpsGrowthMilestoneRow,
  OpsLiabilityRow,
  OpsMergedScorecardRow,
} from '@/lib/ops/opsDashboardTypes'
import { getPayload, type Where } from 'payload'

import type {
  GrowthMilestone,
  InternalOpsSetting,
  OpsAssetLadderItem,
  OpsLiabilityItem,
  OpsScorecardRow,
  Quote,
  ServicePlan,
  User,
} from '@/payload-types'
import type { OpsChartTrendPoint } from '@/lib/ops/loadOpsChartTrend'

/** Authenticated Payload user (ops route guarantees non-null before calling loader). */
export type OpsDashboardUser = User

const OPS_TARGETS_FALLBACK: {
  chartDisclaimer: string
  mrrTargetDisplay: string
  projectedRevenueDisplay: string
} = {
  chartDisclaimer:
    'Revenue uses paid invoices by paid date, pipeline uses weighted sent and accepted quotes by update month, and MRR reflects current active service plans.',
  mrrTargetDisplay: '$1.8k',
  projectedRevenueDisplay: '$13.6k',
}

const LEGACY_ILLUSTRATIVE_CHART_DISCLAIMERS = new Set([
  'Illustrative sample trend for layout only. Connect real accounting and first-party CRM data in a later phase.',
  'Illustrative sample trend for layout only — connect real accounting or CRM data in a later phase.',
])

function normalizeChartDisclaimer(value: null | string | undefined): null | string {
  const trimmed = value?.trim()

  if (!trimmed) {
    return null
  }

  if (LEGACY_ILLUSTRATIVE_CHART_DISCLAIMERS.has(trimmed)) {
    return OPS_TARGETS_FALLBACK.chartDisclaimer
  }

  return trimmed
}

export const QUOTE_PROJECTION_WEIGHTS = {
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

async function loadQuoteProjection({
  demoAccountIds,
  payload,
  user,
  weights,
}: {
  demoAccountIds: number[] | null
  payload: Awaited<ReturnType<typeof getPayload>>
  user: OpsDashboardUser
  weights: { accepted: number; sent: number }
}): Promise<QuoteProjectionMetrics | null> {
  try {
    const baseWhere: Where = {
      status: {
        in: ['accepted', 'sent'],
      },
    }
    const result = await payload.find({
      collection: 'quotes',
      depth: 0,
      limit: 200,
      overrideAccess: false,
      sort: '-updatedAt',
      user,
      where: scopeWhereForAccount(baseWhere, demoAccountIds) ?? baseWhere,
    })

    let acceptedQuoteCount = 0
    let sentQuoteCount = 0
    let weightedRevenue = 0

    for (const quote of result.docs as Quote[]) {
      const total = typeof quote.pricing?.total === 'number' ? quote.pricing.total : 0

      if (quote.status === 'accepted') {
        acceptedQuoteCount += 1
        weightedRevenue += total * weights.accepted
      }

      if (quote.status === 'sent') {
        sentQuoteCount += 1
        weightedRevenue += total * weights.sent
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
  demoAccountIds,
  payload,
  user,
}: {
  demoAccountIds: number[] | null
  payload: Awaited<ReturnType<typeof getPayload>>
  user: OpsDashboardUser
}): Promise<ServicePlanMetrics | null> {
  try {
    const baseWhere: Where = {
      status: {
        equals: 'active',
      },
    }
    const result = await payload.find({
      collection: 'service-plans',
      depth: 0,
      limit: 200,
      overrideAccess: false,
      sort: '-updatedAt',
      user,
      where: scopeWhereForAccount(baseWhere, demoAccountIds) ?? baseWhere,
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
  demoAccountIds,
  payload,
  user,
  where,
}: {
  collection: 'leads' | 'quotes' | 'users'
  demoAccountIds?: number[] | null
  payload: Awaited<ReturnType<typeof getPayload>>
  user: OpsDashboardUser
  where?: Where
}) {
  try {
    const mergedWhere = scopeWhereForAccount(where, demoAccountIds ?? null) ?? where
    const result = await payload.count({
      collection,
      overrideAccess: false,
      user,
      where: mergedWhere,
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

export type OpsDashboardData = {
  assetLadderItems: OpsAssetLadderRow[]
  billingWorkspace: BillingWorkspaceData
  cards: SectionCardItem[]
  chartDisclaimer: string
  chartMetricSummaries: {
    detail: string
    key: 'grossMargin' | 'mrr' | 'projectedRevenue' | 'revenue'
    label: string
    value: string
  }[]
  chartTrend: OpsChartTrendPoint[]
  chartTrendIsLive: boolean
  crmWorkspace: CrmWorkspaceData
  growthMilestones: OpsGrowthMilestoneRow[]
  liabilityItems: OpsLiabilityRow[]
  mergedScorecard: OpsMergedScorecardRow[]
  pipelineSnapshotLabel: string | null
  pipelineSnapshotValue: string | null
  quotesEnabled: boolean
  scorecardTooltipMap: Record<string, string>
}

export async function loadOpsDashboardData(args: {
  demoMode?: boolean
  payload: Awaited<ReturnType<typeof getPayload>>
  quotesEnabled: boolean
  user: OpsDashboardUser
}): Promise<OpsDashboardData> {
  const { demoMode, payload, quotesEnabled, user } = args

  const demoAccountIds =
    demoMode && isAdminUser(user) ? await resolveDemoAccountIds(payload, user) : null

  let chartDisclaimer: string | null = OPS_TARGETS_FALLBACK.chartDisclaimer
  let chartPipelineNote: string | null = null
  let mrrTargetDisplay = OPS_TARGETS_FALLBACK.mrrTargetDisplay
  let projectedRevenueDisplay = OPS_TARGETS_FALLBACK.projectedRevenueDisplay
  let kpiTooltipLeads: string | null = null
  let kpiTooltipQuotes: string | null = null
  let kpiTooltipProjectedRevenue: string | null = null
  let kpiTooltipMrr: string | null = null
  let scorecardKpiTooltips: InternalOpsSetting['scorecardKpiTooltips'] = null
  let quoteWeights: { accepted: number; sent: number } = {
    accepted: QUOTE_PROJECTION_WEIGHTS.accepted,
    sent: QUOTE_PROJECTION_WEIGHTS.sent,
  }

  try {
    const ops = await payload.findGlobal({
      slug: 'internalOpsSettings',
      depth: 0,
      overrideAccess: false,
      user,
    })
    chartDisclaimer = normalizeChartDisclaimer(ops?.chartDisclaimer) ?? OPS_TARGETS_FALLBACK.chartDisclaimer
    if (ops?.chartPipelineNote) chartPipelineNote = ops.chartPipelineNote
    if (ops?.mrrTargetDisplay) mrrTargetDisplay = ops.mrrTargetDisplay
    if (ops?.projectedRevenueDisplay) projectedRevenueDisplay = ops.projectedRevenueDisplay
    if (ops?.kpiTooltipLeads) kpiTooltipLeads = ops.kpiTooltipLeads
    if (ops?.kpiTooltipQuotes) kpiTooltipQuotes = ops.kpiTooltipQuotes
    if (ops?.kpiTooltipProjectedRevenue) kpiTooltipProjectedRevenue = ops.kpiTooltipProjectedRevenue
    if (ops?.kpiTooltipMrr) kpiTooltipMrr = ops.kpiTooltipMrr
    if (ops?.scorecardKpiTooltips) scorecardKpiTooltips = ops.scorecardKpiTooltips
    if (typeof ops?.quoteProjectionWeightAccepted === 'number' && Number.isFinite(ops.quoteProjectionWeightAccepted)) {
      quoteWeights = { ...quoteWeights, accepted: ops.quoteProjectionWeightAccepted }
    }
    if (typeof ops?.quoteProjectionWeightSent === 'number' && Number.isFinite(ops.quoteProjectionWeightSent)) {
      quoteWeights = { ...quoteWeights, sent: ops.quoteProjectionWeightSent }
    }
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

  const leadsWhere = scopeWhereForAccount(undefined, demoAccountIds)
  const quotesWhere = scopeWhereForAccount(undefined, demoAccountIds)
  const customerUsersWhere: Where = {
    and: [
      {
        roles: {
          in: ['customer'],
        },
      },
      ...(demoMode ? [{ email: { contains: DEMO_EMAIL_SUFFIX } }] : []),
    ],
  }

  const [cardsBase, crmWorkspace, quoteProjection, servicePlanMetrics, billingWorkspace] = await Promise.all([
    Promise.all([
      safeCountDocs({
        collection: 'leads',
        demoAccountIds,
        payload,
        user,
        where: leadsWhere,
      }),
      quotesEnabled
        ? safeCountDocs({
            collection: 'quotes',
            demoAccountIds,
            payload,
            user,
            where: quotesWhere,
          })
        : Promise.resolve({ totalDocs: 0, unavailable: false }),
      safeCountDocs({
        collection: 'users',
        demoAccountIds,
        payload,
        user,
        where: customerUsersWhere,
      }),
    ]).then(([leads, quotes, customers]) => ({ leads, quotes, customers })),
    loadCrmWorkspace({
      demoMode,
      payload,
      user,
    }),
    quotesEnabled
      ? loadQuoteProjection({
          demoAccountIds,
          payload,
          user,
          weights: quoteWeights,
        })
      : Promise.resolve(null),
    loadServicePlanMetrics({
      demoAccountIds,
      payload,
      user,
    }),
    loadBillingWorkspace({
      demoAccountIds,
      payload,
      user,
    }),
  ])

  const projectedRow = findScorecardRow(scorecardRowsRaw, 'Projected revenue')
  const revenueRow = findScorecardRow(scorecardRowsRaw, 'Revenue')
  const mrrRow = findScorecardRow(scorecardRowsRaw, 'MRR')
  const grossMarginRow = findScorecardRow(scorecardRowsRaw, 'Gross margin')
  const grossMarginPercent =
    grossMarginRow?.manualValue != null && Number.isFinite(Number(grossMarginRow.manualValue))
      ? Number(grossMarginRow.manualValue)
      : null

  let pipelineSnapshotLabel: string | null = null
  let pipelineSnapshotValue: string | null = null

  const weightSentPct = Math.round(quoteWeights.sent * 100)
  const weightAcceptedPct = Math.round(quoteWeights.accepted * 100)
  const pipelineFormulaFooter = `Weighted pipeline uses ${weightAcceptedPct}% of accepted quote totals and ${weightSentPct}% of sent quote totals (editable in Internal ops targets).`

  let projectedValue = formatCurrencyUsd(0)
  let projectedTrend = `Target ${projectedRevenueDisplay}`
  let projectedFooter =
    'No open sent or accepted quotes in the internal pipeline. Set a manual Projected revenue row on the scorecard or adjust targets in Internal ops targets.'

  if (quoteProjection && quoteProjection.openQuoteCount > 0) {
    projectedValue = formatCurrencyUsd(quoteProjection.weightedRevenue)
    projectedTrend = `${quoteProjection.openQuoteCount} open quotes`
    projectedFooter = [
      pipelineFormulaFooter,
      projectedRow?.targetGuidance?.trim() ? `Scorecard: ${projectedRow.targetGuidance.trim()}` : null,
    ]
      .filter(Boolean)
      .join(' ')
    pipelineSnapshotLabel = 'Internal pipeline mix'
    pipelineSnapshotValue = `${quoteProjection.acceptedQuoteCount} accepted, ${quoteProjection.sentQuoteCount} sent`
  } else if (projectedRow?.manualValue != null && Number.isFinite(Number(projectedRow.manualValue))) {
    projectedValue = formatManualScorecardValue('Projected revenue', Number(projectedRow.manualValue))
    projectedTrend = projectedRow.manualValueLabel?.trim() || 'Scorecard'
    projectedFooter = projectedRow.targetGuidance?.trim() || projectedFooter
  }

  let mrrValue = formatCurrencyUsd(0)
  let mrrTrend = `Target ${mrrTargetDisplay}`

  if (servicePlanMetrics && servicePlanMetrics.activePlanCount > 0) {
    mrrValue = formatCurrencyUsd(servicePlanMetrics.monthlyRecurringRevenue)
    mrrTrend = `${servicePlanMetrics.activePlanCount} active plans`
  } else if (mrrRow?.manualValue != null && Number.isFinite(Number(mrrRow.manualValue))) {
    mrrValue = formatManualScorecardValue('MRR', Number(mrrRow.manualValue))
    mrrTrend = mrrRow.manualValueLabel?.trim() || 'Scorecard'
  }

  const chartTrendResult = await loadOpsChartTrend({
    demoAccountIds,
    grossMarginPercent,
    monthlyRecurringRevenue: servicePlanMetrics?.monthlyRecurringRevenue ?? 0,
    payload,
    quoteWeights,
    user,
  })

  const chartTrend = chartTrendResult.points
  const chartTrendIsLive = chartTrend.some(
    (p) => p.revenue > 0 || p.projectedRevenue > 0 || p.mrr > 0 || p.grossMargin > 0,
  )
  const latestChartPoint = chartTrend[chartTrend.length - 1] ?? null

  let revenueValue = formatCurrencyUsd(latestChartPoint?.revenue ?? 0)
  let revenueTrend = chartTrendIsLive ? 'Paid invoices by paid month' : 'Waiting on closed revenue data'

  if ((latestChartPoint?.revenue ?? 0) <= 0 && revenueRow?.manualValue != null && Number.isFinite(Number(revenueRow.manualValue))) {
    revenueValue = formatManualScorecardValue('Revenue', Number(revenueRow.manualValue))
    revenueTrend = revenueRow.manualValueLabel?.trim() || 'Scorecard'
  }

  let grossMarginValue = `${latestChartPoint?.grossMargin ?? 0}%`
  let grossMarginTrend = grossMarginPercent != null ? `${grossMarginPercent}% scorecard target` : 'Set scorecard margin guidance'

  if ((latestChartPoint?.grossMargin ?? 0) <= 0 && grossMarginRow?.manualValue != null && Number.isFinite(Number(grossMarginRow.manualValue))) {
    grossMarginValue = formatManualScorecardValue('Gross margin', Number(grossMarginRow.manualValue))
    grossMarginTrend = grossMarginRow.manualValueLabel?.trim() || 'Scorecard'
  }

  const chartDisclaimerMerged = [
    chartDisclaimer,
    chartTrendResult.seriesNote,
    quoteProjection && quoteProjection.openQuoteCount > 0 && chartPipelineNote ? chartPipelineNote : null,
  ]
    .filter(Boolean)
    .join(' ')

  const cards = buildOpsDashboardKpiCards({
    cardsBase,
    quotesEnabled,
    liabilityItemsLength: liabilityItems.length,
    quoteProjection,
    servicePlanMetrics,
    projectedRow,
    mrrRow,
    projectedFooter,
    projectedValue,
    projectedTrend,
    mrrValue,
    mrrTrend,
    kpiTooltipLeads,
    kpiTooltipQuotes,
    kpiTooltipProjectedRevenue,
    kpiTooltipMrr,
    quoteProjectionWeights: quoteWeights,
    formatCurrencyUsd,
  })

  const chartMetricSummaries = [
    {
      detail: projectedTrend,
      key: 'projectedRevenue' as const,
      label: 'Pipeline',
      value: projectedValue,
    },
    {
      detail: revenueTrend,
      key: 'revenue' as const,
      label: 'Revenue',
      value: revenueValue,
    },
    {
      detail: mrrTrend,
      key: 'mrr' as const,
      label: 'MRR',
      value: mrrValue,
    },
    {
      detail: grossMarginTrend,
      key: 'grossMargin' as const,
      label: 'Margin',
      value: grossMarginValue,
    },
  ]

  return {
    assetLadderItems,
    billingWorkspace,
    cards,
    chartDisclaimer: chartDisclaimerMerged,
    chartMetricSummaries,
    chartTrend,
    chartTrendIsLive,
    crmWorkspace,
    growthMilestones,
    liabilityItems,
    mergedScorecard,
    pipelineSnapshotLabel,
    pipelineSnapshotValue,
    quotesEnabled,
    scorecardTooltipMap,
  }
}
