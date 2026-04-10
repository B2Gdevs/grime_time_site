import { redirect } from 'next/navigation'
import { OPS_USERS_PATH } from '@/lib/navigation/portalPaths'

export default async function OpsUsersPage() {
  redirect(OPS_USERS_PATH)
}
