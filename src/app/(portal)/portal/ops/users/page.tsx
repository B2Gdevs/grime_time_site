import Link from 'next/link'

import { OpsUsersPageView } from '@/components/portal/ops-admin/OpsUsersPageView'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { loadOpsUsersPageData } from '@/lib/ops/loaders/loadOpsUsersPageData'

export default async function PortalOpsUsersPage() {
  const data = await loadOpsUsersPageData()

  return (
    <>
      <SiteHeader
        title="Users"
        description="Staff access, customer portal linkage, and role-template review in one first-party surface."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link href="/admin/collections/users">Payload users</Link>
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link href="/admin/collections/organization-memberships">Memberships</Link>
            </Button>
          </>
        }
      />
      <OpsUsersPageView data={data} />
    </>
  )
}
