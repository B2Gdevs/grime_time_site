export const GRIME_TIME_DOMAIN = 'grimetime.app' as const
export const GRIME_TIME_DEMO_DOMAIN = `demo.${GRIME_TIME_DOMAIN}` as const

export const DEFAULT_STAFF_EMAILS = [
  `bg@${GRIME_TIME_DOMAIN}`,
  `pb@${GRIME_TIME_DOMAIN}`,
  `de@${GRIME_TIME_DOMAIN}`,
] as const

export const DEFAULT_PORTAL_PREVIEW_TEST_USER_EMAIL = `test_user@${GRIME_TIME_DOMAIN}` as const
export const DEFAULT_LEAD_FALLBACK_EMAIL_DOMAIN = GRIME_TIME_DOMAIN
