import { authEntityEmail, isAdminUser, type RoleCarrier } from '@/lib/auth/roles'
import { DEFAULT_STAFF_EMAILS } from '@/lib/brand/emailDefaults'

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

/** Deduped allowlist entries (order preserved). */
function uniqueEmails(emails: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const e of emails) {
    if (seen.has(e)) continue
    seen.add(e)
    out.push(e)
  }
  return out
}

/**
 * Emails to create when seeding staff Payload users.
 * Uses `QUOTES_INTERNAL_EMAILS` when set so seeded logins match quote admin access; otherwise dev defaults.
 */
export function resolveSeedStaffEmails(): string[] {
  const fromEnv = uniqueEmails(parseQuotesInternalEmailAllowlist())
  if (fromEnv.length > 0) return fromEnv
  return [...DEFAULT_STAFF_EMAILS]
}

/** Display name for seed users when not using fixed team roster. */
export function displayNameForSeedEmail(email: string): string {
  const local = email.split('@')[0]?.trim() ?? email
  if (!local) return email
  if (local.length <= 4 && !/[._-]/.test(local)) {
    return local.toUpperCase()
  }
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ')
}

/** When false, Quotes collection is hidden from everyone in admin. */
export function quotesInternalEnabled(): boolean {
  const v = process.env.QUOTES_INTERNAL_ENABLED?.trim().toLowerCase()
  return v === 'true' || v === '1' || v === 'yes'
}

export function canAccessQuotes(user: RoleCarrier): boolean {
  if (isAdminUser(user)) return true

  const userEmail = authEntityEmail(user)
  if (!userEmail?.trim()) return false
  const allow = parseQuotesInternalEmailAllowlist()
  if (allow.length === 0) return false
  return allow.includes(normalizeEmail(userEmail))
}
