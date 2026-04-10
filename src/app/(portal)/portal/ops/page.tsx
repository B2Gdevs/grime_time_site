import { redirect } from 'next/navigation'

import { OPS_DASHBOARD_PATH } from '@/lib/navigation/portalPaths'

type PortalOpsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function PortalOpsPage({ searchParams }: PortalOpsPageProps) {
  const sp = await searchParams
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === 'string') {
      params.set(key, value)
      continue
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry)
      }
    }
  }

  redirect(params.size > 0 ? `${OPS_DASHBOARD_PATH}?${params.toString()}` : OPS_DASHBOARD_PATH)
}
