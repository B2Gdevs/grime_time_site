type Row = { field: string; value: string }

function pick(rows: Row[], ...names: string[]): string {
  for (const n of names) {
    const hit = rows.find((r) => r.field.toLowerCase() === n.toLowerCase())
    const v = hit?.value?.trim()
    if (v) return v
  }
  return ''
}

/** Derive lead columns from plugin `submissionData` rows (same name hints as EngageBay sync). */
export function extractLeadFromSubmissionData(rows: Row[] | null | undefined): {
  leadEmail: string | null
  leadName: string | null
} {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { leadEmail: null, leadName: null }
  }
  const email = pick(rows, 'email', 'e-mail', 'Email')
  const name = pick(rows, 'fullName', 'fullname', 'name', 'firstName', 'first_name')
  return {
    leadEmail: email || null,
    leadName: name || null,
  }
}
