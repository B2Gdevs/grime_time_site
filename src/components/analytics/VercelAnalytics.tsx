'use client'

import { sanitizeAnalyticsPageEvent } from '@/lib/analytics'
import { Analytics } from '@vercel/analytics/react'

export function VercelAnalytics() {
  return <Analytics beforeSend={sanitizeAnalyticsPageEvent} />
}
