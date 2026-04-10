import { redirect } from 'next/navigation'
import { OPS_WORKSPACE_PATH } from '@/lib/navigation/portalPaths'

type OpsWorkspacePageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function OpsWorkspacePage({ searchParams }: OpsWorkspacePageProps) {
  const sp = await searchParams
  const params = new URLSearchParams()

  if (sp.tab) {
    params.set('tab', sp.tab)
  }

  redirect(params.size > 0 ? `${OPS_WORKSPACE_PATH}?${params.toString()}` : OPS_WORKSPACE_PATH)
}
