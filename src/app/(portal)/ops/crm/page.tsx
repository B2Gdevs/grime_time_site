import { redirect } from 'next/navigation'
import { OPS_WORKSPACE_PATH } from '@/lib/navigation/portalPaths'

export default async function OpsCrmPage() {
  redirect(`${OPS_WORKSPACE_PATH}?tab=crm`)
}
