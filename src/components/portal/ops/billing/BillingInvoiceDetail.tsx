'use client'

import * as React from 'react'
import { LoaderCircleIcon } from 'lucide-react'
import type { UseMutationResult } from '@tanstack/react-query'

import { billingActionMeta, type BillingActionKind } from '@/components/portal/ops/billing/billingActionMeta'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { invoicePaymentSourceOptions } from '@/lib/billing/constants'
import type { BillingWorkspaceInvoiceItem } from '@/lib/billing/workspace'
import { sentenceCase } from '@/lib/customers/format'

type ActionResult = { id: string; paymentUrl: null | string; status: string }

type Props = {
  actionMutation: UseMutationResult<ActionResult, Error, BillingActionKind, unknown>
  amount: string
  note: string
  paymentReference: string
  paymentSource: string
  selectedInvoice: BillingWorkspaceInvoiceItem | null
  setAmount: (value: string) => void
  setNote: (value: string) => void
  setPaymentReference: (value: string) => void
  setPaymentSource: (value: string) => void
}

export function BillingInvoiceDetail({
  actionMutation,
  amount,
  note,
  paymentReference,
  paymentSource,
  selectedInvoice,
  setAmount,
  setNote,
  setPaymentReference,
  setPaymentSource,
}: Props) {
  if (!selectedInvoice) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
        Pick an invoice to manage billing actions.
      </div>
    )
  }

  return (
    <>
      <div>
        <div className="font-medium">{selectedInvoice.title}</div>
        <div className="text-sm text-muted-foreground">
          {selectedInvoice.accountName || selectedInvoice.invoiceNumber}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{sentenceCase(selectedInvoice.status)}</Badge>
          {selectedInvoice.deliveryStatus ? (
            <Badge variant="secondary">{sentenceCase(selectedInvoice.deliveryStatus)}</Badge>
          ) : null}
          {selectedInvoice.collectionMethod ? (
            <Badge variant="secondary">
              {sentenceCase(selectedInvoice.collectionMethod.replaceAll('_', ' '))}
            </Badge>
          ) : null}
          {selectedInvoice.activeDiscountSource !== 'none' ? (
            <Badge variant="secondary">{selectedInvoice.activeDiscountLabel}</Badge>
          ) : null}
        </div>
      </div>

      {selectedInvoice.activeDiscountSource !== 'none' ? (
        <div className="rounded-xl border bg-muted/30 px-3 py-3 text-sm">
          <div className="font-medium">Default discount policy</div>
          <div className="text-muted-foreground">{selectedInvoice.activeDiscountLabel}</div>
          {selectedInvoice.activeDiscountNote ? (
            <div className="mt-1 text-muted-foreground">{selectedInvoice.activeDiscountNote}</div>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="mt-2 h-auto justify-start px-0 text-sm"
            onClick={() => {
              setAmount(String(selectedInvoice.activeDiscountAmount))
              setNote(
                selectedInvoice.activeDiscountNote
                  ? `Default discount applied. ${selectedInvoice.activeDiscountNote}`
                  : 'Default discount applied.',
              )
            }}
          >
            Use default discount
          </Button>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Adjustment amount"
          type="number"
          step="0.01"
        />
        <Select value={paymentSource} onValueChange={setPaymentSource}>
          <SelectTrigger>
            <SelectValue placeholder="Payment source" />
          </SelectTrigger>
          <SelectContent>
            {invoicePaymentSourceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Internal note for the billing action"
        rows={3}
      />

      <Input
        value={paymentReference}
        onChange={(event) => setPaymentReference(event.target.value)}
        placeholder="Payment reference"
      />

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {(Object.entries(billingActionMeta) as Array<[BillingActionKind, (typeof billingActionMeta)[BillingActionKind]]>).map(
          ([action, meta]) => {
            const Icon = meta.icon
            const disabled = actionMutation.isPending || (meta.needsAmount && !amount)

            return (
              <Button
                key={action}
                type="button"
                variant={action === 'sync_send_invoice' ? 'default' : 'outline'}
                disabled={disabled}
                onClick={() => actionMutation.mutate(action)}
                className="justify-start"
              >
                {actionMutation.isPending && actionMutation.variables === action ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <Icon className="size-4" />
                )}
                {meta.label}
              </Button>
            )
          },
        )}
      </div>

      {selectedInvoice.paymentUrl ? (
        <Button asChild variant="ghost" className="justify-start px-0">
          <a href={selectedInvoice.paymentUrl}>Open hosted invoice</a>
        </Button>
      ) : null}
    </>
  )
}

