import { redirect } from 'next/navigation'

import { CUSTOMER_DASHBOARD_PATH } from '@/lib/navigation/portalPaths'

export default async function DashboardRedirectPage() {
  redirect(CUSTOMER_DASHBOARD_PATH)
}
