import crypto from 'crypto'

import { PORTAL_ACCESS_TOKEN_TTL_HOURS } from '@/lib/auth/portal-access/constants'

export function createPortalAccessToken(): string {
  return crypto.randomBytes(24).toString('base64url')
}

export function hashPortalAccessToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function portalAccessExpiryDate(hours = PORTAL_ACCESS_TOKEN_TTL_HOURS): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}
