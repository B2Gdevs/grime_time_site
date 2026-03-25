import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentPayloadUser } from '@/lib/auth/getCurrentPayloadUser'
import { getCustomerPortalData } from '@/lib/customers/getCustomerPortalData'
import { formatCurrency, formatDate, sentenceCase } from '@/lib/customers/format'

export default async function InvoicesPage() {
  const user = await getCurrentPayloadUser()

  if (!user) {
    return null
  }

  const portal = await getCustomerPortalData(user)

  return (
    <>
      <SiteHeader title="Invoices" description="Billing records, balance due, and payment links." />
      <div className="flex flex-1 flex-col px-4 py-6 lg:px-6">
        <div className="grid gap-4">
          {portal.invoices.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No invoices yet</CardTitle>
                <CardDescription>Open and paid invoices will appear here once billing starts.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            portal.invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle>{invoice.title}</CardTitle>
                    <CardDescription>{invoice.invoiceNumber}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{formatCurrency(invoice.balanceDue)}</div>
                    <div className="text-sm text-muted-foreground">{sentenceCase(invoice.status)}</div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="grid gap-1">
                    <p>Total: {formatCurrency(invoice.total)}</p>
                    <p>Due: {formatDate(invoice.dueDate)}</p>
                  </div>
                  {invoice.paymentUrl ? (
                    <Button asChild>
                      <a href={invoice.paymentUrl}>Open payment link</a>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  )
}
