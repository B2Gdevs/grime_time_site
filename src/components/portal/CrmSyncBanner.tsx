'use client'

import Link from 'next/link'

import { AlertCircleIcon, InfoIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type CrmSyncBannerState =
  | { status: 'hubspot_inactive' }
  | { status: 'no_token' }
  | { status: 'error'; message: string }
  | { status: 'degraded'; message: string }

export function CrmSyncBanner({ state }: { state: CrmSyncBannerState | null }) {
  if (!state) return null

  if (state.status === 'hubspot_inactive') {
    return (
      <Card className="mx-4 border-amber-500/40 bg-amber-500/5 lg:mx-6">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base text-amber-950 dark:text-amber-100">CRM day board uses HubSpot</CardTitle>
            <p className="text-sm text-amber-950/90 dark:text-amber-50/90">
              Switch the CRM provider to HubSpot to load tasks by day and open-deal pipeline totals on this page. See{' '}
              <Link href="/docs/ops-dashboard-targets" className="font-medium underline underline-offset-2">
                ops dashboard targets
              </Link>
              .
            </p>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (state.status === 'no_token') {
    return (
      <Card className="mx-4 border-destructive/50 bg-destructive/5 lg:mx-6">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">HubSpot token missing</CardTitle>
            <p className="text-sm text-muted-foreground">
              Set <code className="rounded bg-muted px-1 py-0.5 text-xs">HUBSPOT_ACCESS_TOKEN</code> or{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">HUBSPOT_PRIVATE_APP_TOKEN</code> in the deployment
              environment, then redeploy. Required scopes: CRM read for deals and tasks.
            </p>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (state.status === 'error') {
    return (
      <Card className="mx-4 border-destructive/50 bg-destructive/5 lg:mx-6">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">HubSpot sync error</CardTitle>
            <CardContent className="p-0 text-sm text-muted-foreground">{state.message}</CardContent>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="mx-4 border-amber-500/40 bg-amber-500/5 lg:mx-6">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
        <InfoIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base text-amber-950 dark:text-amber-100">HubSpot data partial</CardTitle>
          <p className="text-sm text-amber-950/90 dark:text-amber-50/90">{state.message}</p>
        </div>
      </CardHeader>
    </Card>
  )
}
