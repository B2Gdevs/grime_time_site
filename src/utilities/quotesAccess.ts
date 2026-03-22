/**
 * Internal quote tools: gated by env (see `quote-system-and-texas-compliance.md`).
 */

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function parseQuotesInternalEmailAllowlist(): string[] {
  const raw = process.env.QUOTES_INTERNAL_EMAILS?.trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => normalizeEmail(s))
    .filter(Boolean)
}

/** When false, Quotes collection is hidden from everyone in admin. */
export function quotesInternalEnabled(): boolean {
  const v = process.env.QUOTES_INTERNAL_ENABLED?.trim().toLowerCase()
  return v === 'true' || v === '1' || v === 'yes'
}

export function canAccessQuotes(userEmail: string | null | undefined): boolean {
  if (!userEmail?.trim()) return false
  const allow = parseQuotesInternalEmailAllowlist()
  if (allow.length === 0) return false
  return allow.includes(normalizeEmail(userEmail))
}
