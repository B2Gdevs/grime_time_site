import { redirect } from 'next/navigation'

export default async function OpsScorecardPage() {
  redirect('/ops/workspace?tab=scorecard')
}
