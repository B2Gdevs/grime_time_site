import Link from 'next/link'

import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentPayloadUser } from '@/lib/auth/getCurrentPayloadUser'
import { getCustomerPortalData } from '@/lib/customers/getCustomerPortalData'
import { formatCurrency, formatDate, sentenceCase } from '@/lib/customers/format'

export default async function EstimatesPage() {
  const user = await getCurrentPayloadUser()

  if (!user) {
    return null
  }

  const portal = await getCustomerPortalData(user)

  return (
    <>
      <SiteHeader
        title="Estimates"
        description="Approved and active quote records tied to your customer account."
        actions={
          <Button asChild>
            <Link href="/#instant-quote">Request a new quote</Link>
          </Button>
        }
      />
      <div className="flex flex-1 flex-col px-4 py-6 lg:px-6">
        <div className="grid gap-4">
          {portal.estimates.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No estimates yet</CardTitle>
                <CardDescription>
                  Once a scoped estimate is sent to your account, it will show up here.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            portal.estimates.map((estimate) => (
              <Card key={estimate.id}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle>{estimate.title}</CardTitle>
                    <CardDescription>{estimate.address}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{formatCurrency(estimate.total)}</div>
                    <div className="text-sm text-muted-foreground">{sentenceCase(estimate.status)}</div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-muted-foreground">
                  <p>{estimate.serviceSummary}</p>
                  <p>Valid until: {formatDate(estimate.validUntil)}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  )
}
