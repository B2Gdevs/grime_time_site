import { DEFAULT_STAFF_EMAILS } from '@/lib/brand/emailDefaults'

const LOCAL_ONLY_EMAIL_SUFFIX = '.local'
const RESERVED_STAFF_EMAILS = new Set<string>(DEFAULT_STAFF_EMAILS)

export function normalizeCustomerAuthEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function getCustomerAuthEmailIssue(email: string): null | string {
  const normalized = normalizeCustomerAuthEmail(email)

  if (!normalized) {
    return null
  }

  if (RESERVED_STAFF_EMAILS.has(normalized)) {
    return 'That address is reserved for staff. Use the Grime Time sign-in flow for team access, then open /ops or /admin.'
  }

  if (normalized.endsWith(LOCAL_ONLY_EMAIL_SUFFIX)) {
    return 'Use a real email inbox for customer access. Supabase rejects .local addresses for sign-in, signup, and email links.'
  }

  return null
}
