import { redirect } from 'next/navigation'

export default async function OpsTodayPage() {
  redirect('/ops/workspace?tab=today')
}
