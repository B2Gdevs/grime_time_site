import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import config from '@payload-config'
import { getPayload } from 'payload'

import { GRIME_DEMO_MODE_KEY } from '@/lib/demo/constants'

import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import type { OpsCommandCenterTabId } from '@/lib/ops/opsCommandCenterTabs'
import { loadOpsDashboardData, type OpsDashboardData } from '@/lib/ops/loaders/loadOpsDashboardData'
import { quotesInternalEnabled } from '@/utilities/quotesAccess'

export type OpsRouteData = {
  data: OpsDashboardData
  user: Awaited<ReturnType<typeof getCurrentAuthContext>>['realUser']
}

export async function loadOpsRouteData(): Promise<OpsRouteData> {
  const auth = await getCurrentAuthContext()
  const user = auth.realUser

  if (!user) {
    redirect('/login')
  }

  if (!auth.isRealAdmin) {
    redirect('/')
  }

  const payload = await getPayload({ config })
  const cookieStore = await cookies()
  const demoMode = cookieStore.get(GRIME_DEMO_MODE_KEY)?.value === '1'

  const data = await loadOpsDashboardData({
    demoMode,
    payload,
    quotesEnabled: quotesInternalEnabled(),
    user,
  })

  return {
    data,
    user,
  }
}

export function resolveInitialOpsTab(tab: OpsCommandCenterTabId | null | undefined): OpsCommandCenterTabId | undefined {
  return tab ?? undefined
}
