import type { SectionCardItem } from '@/components/section-cards'
import { appendTooltipSections, resolveOpsKpiTooltip } from '@/lib/ops/opsKpiCards'
import type { OpsScorecardRow } from '@/payload-types'

type SafeCount = {
  totalDocs: number
  unavailable: boolean
}

type CardsBase = {
  leads: SafeCount
  quotes: SafeCount
  customers: SafeCount
}

type QuoteProjectionMetrics = {
  acceptedQuoteCount: number
  openQuoteCount: number
  sentQuoteCount: number
}

type ServicePlanMetrics = {
  activePlanCount: number
  annualRecurringRevenue: number
  monthlyRecurringRevenue: number
}

export function buildOpsDashboardKpiCards(args: {
  cardsBase: CardsBase
  quotesEnabled: boolean
  liabilityItemsLength: number
  quoteProjection: QuoteProjectionMetrics | null
  servicePlanMetrics: ServicePlanMetrics | null
  projectedRow: OpsScorecardRow | null
  mrrRow: OpsScorecardRow | null
  projectedFooter: string
  projectedValue: string
  projectedTrend: string
  mrrValue: string
  mrrTrend: string
  kpiTooltipLeads: string | null | undefined
  kpiTooltipQuotes: string | null | undefined
  kpiTooltipProjectedRevenue: string | null | undefined
  kpiTooltipMrr: string | null | undefined
  quoteProjectionWeights: { accepted: number; sent: number }
  formatCurrencyUsd: (value: number) => string
}): SectionCardItem[] {
  const {
    cardsBase,
    quotesEnabled,
    liabilityItemsLength,
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
    quoteProjectionWeights,
    formatCurrencyUsd,
  } = args

  const leadsTooltip = appendTooltipSections(resolveOpsKpiTooltip('leads', kpiTooltipLeads), [
    cardsBase.leads.unavailable ? 'Lead counts are temporarily unavailable.' : null,
  ])

  const quotesTooltip = appendTooltipSections(resolveOpsKpiTooltip('quotes', kpiTooltipQuotes), [
    !quotesEnabled ? 'Internal quotes collection is disabled by env; count may read as zero.' : null,
    cardsBase.quotes.unavailable ? 'Quote counts are temporarily unavailable.' : null,
  ])

  const projectedRuntimeNotes: string[] = []
  if (quoteProjection && quoteProjection.openQuoteCount > 0) {
    projectedRuntimeNotes.push(
      `Open pipeline: ${quoteProjection.openQuoteCount} quotes (${quoteProjection.acceptedQuoteCount} accepted × ${Math.round(quoteProjectionWeights.accepted * 100)}%, ${quoteProjection.sentQuoteCount} sent × ${Math.round(quoteProjectionWeights.sent * 100)}%).`,
    )

    if (projectedRow?.targetGuidance?.trim()) {
      projectedRuntimeNotes.push(`Scorecard note: ${projectedRow.targetGuidance.trim()}`)
    }
  } else {
    if (projectedRow?.targetGuidance?.trim()) {
      projectedRuntimeNotes.push(`Scorecard note: ${projectedRow.targetGuidance.trim()}`)
    } else if (projectedFooter.trim()) {
      projectedRuntimeNotes.push(projectedFooter)
    }
  }

  const projectedTooltip = appendTooltipSections(
    resolveOpsKpiTooltip('projectedRevenue', kpiTooltipProjectedRevenue),
    projectedRuntimeNotes,
  )

  const mrrRuntimeNotes: string[] = []
  if (servicePlanMetrics && servicePlanMetrics.activePlanCount > 0) {
    mrrRuntimeNotes.push(
      `${servicePlanMetrics.activePlanCount} active plan(s) · ARR ${formatCurrencyUsd(servicePlanMetrics.annualRecurringRevenue)}`,
    )

    if (mrrRow?.targetGuidance?.trim()) {
      mrrRuntimeNotes.push(`Scorecard note: ${mrrRow.targetGuidance.trim()}`)
    }
  } else {
    if (!cardsBase.customers.unavailable) {
      mrrRuntimeNotes.push(`${cardsBase.customers.totalDocs} customer account(s) in the portal.`)
    } else {
      mrrRuntimeNotes.push('Customer counts are temporarily unavailable.')
    }

    mrrRuntimeNotes.push(`${liabilityItemsLength} liability row(s) in the Scorecard tab.`)

    if (mrrRow?.targetGuidance?.trim()) {
      mrrRuntimeNotes.push(`Scorecard note: ${mrrRow.targetGuidance.trim()}`)
    }
  }

  const mrrTooltip = appendTooltipSections(resolveOpsKpiTooltip('mrr', kpiTooltipMrr), mrrRuntimeNotes)

  const cards: SectionCardItem[] = [
    {
      compact: true,
      metricTooltip: leadsTooltip,
      title: 'Leads',
      trend: cardsBase.leads.unavailable ? 'Unavailable' : `${cardsBase.leads.totalDocs} tracked`,
      value: String(cardsBase.leads.totalDocs),
    },
    {
      compact: true,
      metricTooltip: quotesTooltip,
      title: 'Quotes',
      trend: cardsBase.quotes.unavailable ? 'Unavailable' : `${cardsBase.quotes.totalDocs} tracked`,
      value: String(cardsBase.quotes.totalDocs),
    },
    {
      compact: true,
      metricTooltip: projectedTooltip,
      title: 'Projected revenue',
      trend: projectedTrend,
      value: projectedValue,
    },
    {
      compact: true,
      metricTooltip: mrrTooltip,
      title: 'MRR',
      trend: mrrTrend,
      value: mrrValue,
    },
  ]

  return cards
}

