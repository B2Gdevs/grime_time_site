import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { GRIME_DEMO_MODE_KEY } from '@/lib/demo/constants'

import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import type { OpsCommandCenterTabId } from '@/lib/ops/opsCommandCenterTabs'
import { loadOpsDashboardData, type OpsDashboardData } from '@/lib/ops/loaders/loadOpsDashboardData'
import { hasSeenOpsWelcome } from '@/lib/ops/welcome'
import { quotesInternalEnabled } from '@/utilities/quotesAccess'

export type OpsRouteData = {
  data: OpsDashboardData
  showWelcomeModal: boolean
  user: Awaited<ReturnType<typeof getCurrentAuthContext>>['realUser']
}

export async function loadOpsRouteData(): Promise<OpsRouteData> {
  const auth = await getCurrentAuthContext()
  const user = auth.realUser
  const payload = auth.payload

  if (!user) {
    redirect('/login')
  }

  if (!auth.isRealAdmin) {
    redirect('/')
  }

  const cookieStore = await cookies()
  const demoMode = cookieStore.get(GRIME_DEMO_MODE_KEY)?.value === '1'

  const data = await loadOpsDashboardData({
    demoMode,
    payload,
    quotesEnabled: quotesInternalEnabled(),
    user,
  })
  const showWelcomeModal = !(await hasSeenOpsWelcome(payload, Number(user.id)))

  return {
    data,
    showWelcomeModal,
    user,
  }
}

export function resolveInitialOpsTab(tab: OpsCommandCenterTabId | null | undefined): OpsCommandCenterTabId | undefined {
  return tab ?? undefined
}
