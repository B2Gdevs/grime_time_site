import type { Payload, Where } from 'payload'

import { scopeWhereForAccount } from '@/lib/demo/scopeWhere'
import type { Invoice, Quote, User } from '@/payload-types'

export type OpsChartTrendPoint = {
  grossMargin: number
  month: string
  mrr: number
  projectedRevenue: number
  revenue: number
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function startOfUtcMonth(year: number, monthIndex0: number): Date {
  return new Date(Date.UTC(year, monthIndex0, 1, 0, 0, 0, 0))
}

function endOfUtcMonth(year: number, monthIndex0: number): Date {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0, 23, 59, 59, 999))
}

/** Last `count` calendar months ending at `reference` (inclusive), oldest first. */
export function buildUtcMonthWindows(
  count: number,
  reference: Date = new Date(),
): { end: Date; key: string; label: string; start: Date }[] {
  const out: { end: Date; key: string; label: string; start: Date }[] = []
  let y = reference.getUTCFullYear()
  let m = reference.getUTCMonth()

  for (let i = 0; i < count; i += 1) {
    const start = startOfUtcMonth(y, m)
    const end = endOfUtcMonth(y, m)
    out.push({
      end,
      key: monthKey(start),
      label: MONTH_LABELS[m],
      start,
    })
    m -= 1
    if (m < 0) {
      m = 11
      y -= 1
    }
  }

  return out.reverse()
}

export async function loadOpsChartTrend(args: {
  demoAccountIds: number[] | null
  grossMarginPercent: number | null
  monthlyRecurringRevenue: number
  payload: Payload
  quoteWeights: { accepted: number; sent: number }
  user: User
}): Promise<{ points: OpsChartTrendPoint[]; seriesNote: string | null }> {
  const { demoAccountIds, grossMarginPercent, monthlyRecurringRevenue, payload, quoteWeights, user } = args

  const windows = buildUtcMonthWindows(6)
  const revenueByKey = new Map<string, number>()
  const projectedByKey = new Map<string, number>()

  try {
    const invoiceWhere: Where = {
      and: [
        { status: { equals: 'paid' } },
        { paidAt: { exists: true } },
      ],
    }
    const inv = await payload.find({
      collection: 'invoices',
      depth: 0,
      limit: 500,
      overrideAccess: false,
      sort: '-paidAt',
      user,
      where: scopeWhereForAccount(invoiceWhere, demoAccountIds) ?? invoiceWhere,
    })

    for (const doc of inv.docs as Invoice[]) {
      const paidAt = doc.paidAt
      if (!paidAt) continue
      const t = new Date(paidAt).getTime()
      const total = typeof doc.total === 'number' ? doc.total : 0
      for (const w of windows) {
        if (t >= w.start.getTime() && t <= w.end.getTime()) {
          revenueByKey.set(w.key, (revenueByKey.get(w.key) ?? 0) + total)
          break
        }
      }
    }
  } catch (err) {
    payload.logger.warn({ err, msg: 'Ops chart: invoice revenue series failed.' })
  }

  try {
    const quoteWhere: Where = {
      status: { in: ['accepted', 'sent'] },
    }
    const q = await payload.find({
      collection: 'quotes',
      depth: 0,
      limit: 500,
      overrideAccess: false,
      sort: '-updatedAt',
      user,
      where: scopeWhereForAccount(quoteWhere, demoAccountIds) ?? quoteWhere,
    })

    for (const doc of q.docs as Quote[]) {
      const updated = doc.updatedAt
      if (!updated) continue
      const t = new Date(updated).getTime()
      const total = typeof doc.pricing?.total === 'number' ? doc.pricing.total : 0
      const wgt =
        doc.status === 'accepted' ? quoteWeights.accepted : doc.status === 'sent' ? quoteWeights.sent : 0
      const weighted = total * wgt
      for (const w of windows) {
        if (t >= w.start.getTime() && t <= w.end.getTime()) {
          projectedByKey.set(w.key, (projectedByKey.get(w.key) ?? 0) + weighted)
          break
        }
      }
    }
  } catch (err) {
    payload.logger.warn({ err, msg: 'Ops chart: quote weighted series failed.' })
  }

  const margin = grossMarginPercent != null && Number.isFinite(grossMarginPercent) ? grossMarginPercent : 0

  const points: OpsChartTrendPoint[] = windows.map((w) => ({
    grossMargin: margin,
    month: w.label,
    mrr: monthlyRecurringRevenue,
    projectedRevenue: projectedByKey.get(w.key) ?? 0,
    revenue: revenueByKey.get(w.key) ?? 0,
  }))

  const hasPaid = points.some((p) => p.revenue > 0)
  const hasPipeline = points.some((p) => p.projectedRevenue > 0)
  const seriesNote =
    hasPaid || hasPipeline || monthlyRecurringRevenue > 0
      ? 'Revenue uses paid invoices by paid date; pipeline uses quotes in sent/accepted status by last updated month; MRR is current active-plan run rate across months; margin uses the Gross margin scorecard manual % when set.'
      : null

  return { points, seriesNote }
}
