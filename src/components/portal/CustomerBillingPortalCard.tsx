'use client'

import { useMutation } from '@tanstack/react-query'
import { ArrowUpRightIcon, CreditCardIcon, LoaderCircleIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sentenceCase } from '@/lib/customers/format'
import { requestJson } from '@/lib/query/request'

type Props = {
  billingMode: null | string
  billingRollupMode: null | string
  billingTermsDays: number
  canManageInStripe: boolean
  portalAccessMode: null | string
  returnPath?: string
}

export function CustomerBillingPortalCard({
  billingMode,
  billingRollupMode,
  billingTermsDays,
  canManageInStripe,
  portalAccessMode,
  returnPath = '/account',
}: Props) {
  const [errorMessage, setErrorMessage] = useState<null | string>(null)
  const portalMutation = useMutation({
    mutationFn: () =>
      requestJson<{ url: string }>('/api/portal/billing/portal-session', {
        body: JSON.stringify({ returnPath }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Could not open Stripe billing right now.')
    },
    onSuccess: ({ url }) => {
      setErrorMessage(null)
      window.location.assign(url)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCardIcon className="size-5 text-primary" />
          Billing management
        </CardTitle>
        <CardDescription>Use Stripe's hosted billing tools for payment methods, invoices, and receipts.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm text-muted-foreground">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border bg-muted/30 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Billing mode</div>
            <div className="mt-2 font-medium text-foreground">
              {billingMode ? sentenceCase(billingMode.replaceAll('_', ' ')) : 'Not set'}
            </div>
          </div>
          <div className="rounded-xl border bg-muted/30 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Rollup</div>
            <div className="mt-2 font-medium text-foreground">
              {billingRollupMode ? sentenceCase(billingRollupMode.replaceAll('_', ' ')) : 'Not set'}
            </div>
          </div>
          <div className="rounded-xl border bg-muted/30 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Terms</div>
            <div className="mt-2 font-medium text-foreground">
              {billingTermsDays > 0 ? `${billingTermsDays} days` : 'Due on receipt'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-4">
          <div>
            <div className="font-medium text-foreground">
              {canManageInStripe ? 'Manage billing in Stripe' : 'Stripe portal not enabled'}
            </div>
            <div>
              {portalAccessMode
                ? `Portal access: ${sentenceCase(portalAccessMode.replaceAll('_', ' '))}`
                : 'Your team has not enabled self-serve Stripe billing for this account yet.'}
            </div>
          </div>
          <Button
            disabled={!canManageInStripe || portalMutation.isPending}
            onClick={() => portalMutation.mutate()}
            type="button"
          >
            {portalMutation.isPending ? (
              <>
                <LoaderCircleIcon className="size-4 animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <ArrowUpRightIcon className="size-4" />
                Open billing portal
              </>
            )}
          </Button>
        </div>
        {errorMessage ? <div className="text-sm text-destructive">{errorMessage}</div> : null}
      </CardContent>
    </Card>
  )
}
