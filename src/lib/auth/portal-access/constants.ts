import { CUSTOMER_DASHBOARD_PATH } from '@/lib/navigation/portalPaths'

export const PORTAL_INVITE_STATE_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Claim pending', value: 'claim_pending' },
  { label: 'Invite pending', value: 'invite_pending' },
  { label: 'Active', value: 'active' },
] as const

export type PortalInviteState = (typeof PORTAL_INVITE_STATE_OPTIONS)[number]['value']

export const PORTAL_ACCESS_TOKEN_TTL_HOURS = 72

export const PORTAL_ACCESS_TOKEN_QUERY_KEY = 'claim'

export const PORTAL_ACCESS_DEFAULT_NEXT_PATH = CUSTOMER_DASHBOARD_PATH
