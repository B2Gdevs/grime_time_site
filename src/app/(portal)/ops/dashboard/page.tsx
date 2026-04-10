import { redirect } from 'next/navigation'
import { OPS_DASHBOARD_PATH } from '@/lib/navigation/portalPaths'

type OpsDashboardPageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function OpsDashboardPage({ searchParams }: OpsDashboardPageProps) {
  const sp = await searchParams
  const params = new URLSearchParams()

  if (sp.tab) {
    params.set('tab', sp.tab)
  }

  redirect(params.size > 0 ? `${OPS_DASHBOARD_PATH}?${params.toString()}` : OPS_DASHBOARD_PATH)
}
