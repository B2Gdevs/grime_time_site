import { redirect } from 'next/navigation'

export default async function OpsCrmPage() {
  redirect('/ops/workspace?tab=crm')
}
