import { businessScorecard } from '@/lib/ops/businessOperatingSystem'
import type { OpsMergedScorecardRow } from '@/lib/ops/opsDashboardTypes'

type DbRow = {
  formula?: string | null
  manualValue?: number | null
  manualValueLabel?: string | null
  sortOrder?: number | null
  targetGuidance?: string | null
  title: string
}

/** Merge Payload scorecard rows over static defaults; preserve default KPI order then append extras. */
export function mergeScorecardRows(dbRows: DbRow[]): OpsMergedScorecardRow[] {
  const byTitle = new Map<string, DbRow>()
  for (const row of dbRows) {
    if (row.title?.trim()) {
      byTitle.set(row.title.trim(), row)
    }
  }

  const seen = new Set<string>()
  const out: OpsMergedScorecardRow[] = []

  for (const def of businessScorecard) {
    seen.add(def.name)
    const row = byTitle.get(def.name)
    const manualLine =
      row?.manualValue != null && Number.isFinite(Number(row.manualValue))
        ? `${(row.manualValueLabel ?? 'Manual value').trim()}: ${row.manualValue}`
        : undefined
    out.push({
      formula: row?.formula?.trim() || def.formula,
      manualLine,
      name: def.name,
      target: row?.targetGuidance?.trim() || def.target,
    })
  }

  const extras = [...dbRows]
    .filter((r) => r.title?.trim() && !seen.has(r.title.trim()))
    .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))

  for (const row of extras) {
    const manualLine =
      row.manualValue != null && Number.isFinite(Number(row.manualValue))
        ? `${(row.manualValueLabel ?? 'Manual value').trim()}: ${row.manualValue}`
        : undefined
    out.push({
      formula: row.formula?.trim() || '—',
      manualLine,
      name: row.title.trim(),
      target: row.targetGuidance?.trim() || '—',
    })
  }

  return out
}
