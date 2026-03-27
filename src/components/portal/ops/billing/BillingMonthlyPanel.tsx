'use client'

import { LoaderCircleIcon, ReceiptTextIcon } from 'lucide-react'
import type { UseMutationResult } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { BillingWorkspaceMonthlyCandidate } from '@/lib/billing/workspace'
import { formatCurrency } from '@/lib/customers/format'

type Props = {
  monthlyCandidates: BillingWorkspaceMonthlyCandidate[]
  monthlyMutation: UseMutationResult<{ id: string; invoiceNumber: string; status: string }, Error, void, unknown>
  periodEnd: string
  periodStart: string
  selectedMonthlyAccountId: null | string
  selectedMonthlyCandidate: BillingWorkspaceMonthlyCandidate | null
  setPeriodEnd: (value: string) => void
  setPeriodStart: (value: string) => void
  setSelectedMonthlyAccountId: (value: string) => void
}

export function BillingMonthlyPanel({
  monthlyCandidates,
  monthlyMutation,
  periodEnd,
  periodStart,
  selectedMonthlyAccountId,
  selectedMonthlyCandidate,
  setPeriodEnd,
  setPeriodStart,
  setSelectedMonthlyAccountId,
}: Props) {
  return (
    <div className="grid gap-4 rounded-2xl border p-4">
      <div>
        <div className="font-medium">Monthly consolidated billing</div>
        <div className="text-sm text-muted-foreground">
          Create one monthly invoice for commercial accounts with completed ready-to-bill work.
        </div>
      </div>

      {monthlyCandidates.length > 0 ? (
        <>
          <Select value={selectedMonthlyAccountId ?? undefined} onValueChange={setSelectedMonthlyAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Pick an account" />
            </SelectTrigger>
            <SelectContent>
              {monthlyCandidates.map((candidate) => (
                <SelectItem key={candidate.accountId} value={candidate.accountId}>
                  {candidate.accountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedMonthlyCandidate ? (
            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
              <div className="font-medium">{selectedMonthlyCandidate.accountName}</div>
              <div className="text-muted-foreground">
                {selectedMonthlyCandidate.readyCount} ready appointment
                {selectedMonthlyCandidate.readyCount === 1 ? '' : 's'} |{' '}
                {formatCurrency(selectedMonthlyCandidate.billableAmount)} pending
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">Terms {selectedMonthlyCandidate.billingTermsDays || 0} days</Badge>
              </div>
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
            <Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
          </div>

          <Button
            type="button"
            disabled={!selectedMonthlyCandidate || monthlyMutation.isPending}
            onClick={() => monthlyMutation.mutate()}
            className="justify-start"
            variant="outline"
          >
            {monthlyMutation.isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <ReceiptTextIcon className="size-4" />
            )}
            Create monthly invoice
          </Button>
        </>
      ) : (
        <div className="rounded-xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
          No monthly-consolidated commercial accounts have ready-to-bill appointments right now.
        </div>
      )}
    </div>
  )
}

