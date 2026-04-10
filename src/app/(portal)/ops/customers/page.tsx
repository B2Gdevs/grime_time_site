import { redirect } from 'next/navigation'
import { OPS_CUSTOMERS_PATH } from '@/lib/navigation/portalPaths'

export default async function OpsCustomersPage() {
  redirect(OPS_CUSTOMERS_PATH)
}
