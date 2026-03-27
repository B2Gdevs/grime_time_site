'use client'

import { CreditCardIcon, LoaderCircleIcon } from 'lucide-react'
import type { UseMutationResult } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { BillingWorkspaceServicePlanItem } from '@/lib/billing/workspace'
import { formatDate, sentenceCase } from '@/lib/customers/format'

type Props = {
  selectedServicePlan: BillingWorkspaceServicePlanItem | null
  selectedServicePlanId: null | string
  servicePlans: BillingWorkspaceServicePlanItem[]
  setSelectedServicePlanId: (value: string) => void
  subscriptionMutation: UseMutationResult<
    { id: string; status: string; stripeSubscriptionID: null | string },
    Error,
    void,
    unknown
  >
}

export function BillingSubscriptionPanel({
  selectedServicePlan,
  selectedServicePlanId,
  servicePlans,
  setSelectedServicePlanId,
  subscriptionMutation,
}: Props) {
  return (
    <div className="grid gap-4 rounded-2xl border p-4">
      <div>
        <div className="font-medium">Subscription billing</div>
        <div className="text-sm text-muted-foreground">
          Sync or create Stripe-backed subscription state for recurring service plans.
        </div>
      </div>

      {servicePlans.length > 0 ? (
        <>
          <Select value={selectedServicePlanId ?? undefined} onValueChange={setSelectedServicePlanId}>
            <SelectTrigger>
              <SelectValue placeholder="Pick a service plan" />
            </SelectTrigger>
            <SelectContent>
              {servicePlans.map((servicePlan) => (
                <SelectItem key={servicePlan.id} value={servicePlan.id}>
                  {servicePlan.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedServicePlan ? (
            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
              <div className="font-medium">{selectedServicePlan.title}</div>
              <div className="text-muted-foreground">
                {selectedServicePlan.accountName || 'Unassigned account'}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{sentenceCase(selectedServicePlan.status)}</Badge>
                {selectedServicePlan.billingMode ? (
                  <Badge variant="secondary">
                    {sentenceCase(selectedServicePlan.billingMode.replaceAll('_', ' '))}
                  </Badge>
                ) : null}
                {selectedServicePlan.nextInvoiceAt ? (
                  <Badge variant="secondary">Next {formatDate(selectedServicePlan.nextInvoiceAt)}</Badge>
                ) : null}
              </div>
            </div>
          ) : null}

          <Button
            type="button"
            disabled={!selectedServicePlan || subscriptionMutation.isPending}
            onClick={() => subscriptionMutation.mutate()}
            className="justify-start"
          >
            {subscriptionMutation.isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <CreditCardIcon className="size-4" />
            )}
            Sync subscription
          </Button>
        </>
      ) : (
        <div className="rounded-xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
          No recurring service plans need Stripe subscription sync right now.
        </div>
      )}
    </div>
  )
}

