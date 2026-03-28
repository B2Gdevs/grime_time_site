import { redirect } from 'next/navigation'

export default async function OpsMilestonesPage() {
  redirect('/ops/workspace?tab=milestones')
}
