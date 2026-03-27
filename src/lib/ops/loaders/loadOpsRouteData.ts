import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import config from '@payload-config'
import { getPayload } from 'payload'

import { GRIME_DEMO_MODE_KEY } from '@/lib/demo/constants'

import { getCurrentPayloadUser, userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import type { OpsCommandCenterTabId } from '@/lib/ops/opsCommandCenterTabs'
import { loadOpsDashboardData, type OpsDashboardData } from '@/lib/ops/loaders/loadOpsDashboardData'
import { quotesInternalEnabled } from '@/utilities/quotesAccess'

export type OpsRouteData = {
  data: OpsDashboardData
  user: Awaited<ReturnType<typeof getCurrentPayloadUser>>
}

export async function loadOpsRouteData(): Promise<OpsRouteData> {
  const user = await getCurrentPayloadUser()

  if (!user) {
    redirect('/login')
  }

  if (!userIsAdmin(user)) {
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
