'use client'

import { Badge } from '@/components/ui/badge'
import type { BillingWorkspaceInvoiceItem } from '@/lib/billing/workspace'
import { formatCurrency, formatDate, sentenceCase } from '@/lib/customers/format'

type Props = {
  invoices: BillingWorkspaceInvoiceItem[]
  selectedInvoiceId: null | string
  setSelectedInvoiceId: (id: string) => void
}

export function BillingInvoiceList({ invoices, selectedInvoiceId, setSelectedInvoiceId }: Props) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
        No invoices need billing follow-up right now.
      </div>
    )
  }

  return (
    <>
      {invoices.map((invoice) => (
        <button
          key={invoice.id}
          type="button"
          onClick={() => setSelectedInvoiceId(invoice.id)}
          className={`rounded-xl border px-4 py-3 text-left transition-colors hover:bg-muted/40 ${
            selectedInvoiceId === invoice.id ? 'border-primary/40 bg-primary/5' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{invoice.title}</div>
              <div className="truncate text-sm text-muted-foreground">
                {invoice.accountName || invoice.invoiceNumber}
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Due {formatDate(invoice.dueDate)} | {sentenceCase(invoice.status)}
              </div>
            </div>
            <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'outline'}>
              {formatCurrency(invoice.balanceDue)}
            </Badge>
          </div>
        </button>
      ))}
    </>
  )
}

