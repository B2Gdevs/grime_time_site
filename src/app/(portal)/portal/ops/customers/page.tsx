import Link from 'next/link'

import { OpsCustomersPageView } from '@/components/portal/ops-admin/OpsCustomersPageView'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { loadOpsCustomersPageData } from '@/lib/ops/loaders/loadOpsCustomersPageData'

export default async function PortalOpsCustomersPage() {
  const data = await loadOpsCustomersPageData()

  return (
    <>
      <SiteHeader
        title="Customers"
        description="Account-first customer operations with access and billing cues layered on top."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link href="/admin/collections/accounts">Accounts</Link>
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link href="/admin/collections/users">Users</Link>
            </Button>
          </>
        }
      />
      <OpsCustomersPageView data={data} />
    </>
  )
}
