export const ORGANIZATIONS_COLLECTION_SLUG = 'organizations' as const
export const ORGANIZATION_MEMBERSHIPS_COLLECTION_SLUG = 'organization-memberships' as const

export const DEFAULT_GRIME_TIME_CLERK_ORG_ID =
  process.env.GRIME_TIME_CLERK_ORG_ID?.trim() || 'org_3BmXmwG7NpGNO1JKpE3MkR667Mm'
export const DEFAULT_GRIME_TIME_ORGANIZATION_SLUG = 'grime-time' as const
