import { redirect } from 'next/navigation'

export default async function OpsAssetsPage() {
  redirect('/ops/workspace?tab=assets')
}
