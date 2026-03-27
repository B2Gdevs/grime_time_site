import { OpsSectionPage } from '@/components/portal/ops/OpsSectionPage'
import { loadOpsRouteData } from '@/lib/ops/loaders/loadOpsRouteData'

export default async function OpsCrmPage() {
  const { data } = await loadOpsRouteData()

  return <OpsSectionPage activeSection="crm" data={data} />
}
