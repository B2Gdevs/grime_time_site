/** Login email domain for seeded demo customers (see `src/endpoints/seed/demo-personas.ts`). */
export const DEMO_EMAIL_SUFFIX = '@demo.grimetime.app'

export function isDemoEmail(email: null | string | undefined): boolean {
  return typeof email === 'string' && email.trim().toLowerCase().endsWith(DEMO_EMAIL_SUFFIX)
}

/** Cookie + localStorage: admin enables “show only demo fixtures” on /ops and CRM APIs. */
export const GRIME_DEMO_MODE_KEY = 'grime_demo_mode'

/** URL flag: marketing site enables site tours + demo cookie for one session. */
export const DEMO_QUERY_PARAM = 'demo'
