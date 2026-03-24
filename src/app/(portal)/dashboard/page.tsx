import { redirect } from 'next/navigation'

import { CustomerDashboardView } from '@/components/portal/CustomerDashboardView'
import type { SectionCardItem } from '@/components/section-cards'
import { getCurrentPayloadUser, userIsAdmin } from '@/lib/auth/getCurrentPayloadUser'
import { getPortalDocs } from '@/lib/docs/catalog'

export default async function DashboardPage() {
  const user = await getCurrentPayloadUser()

  if (!user) {
    return null
  }

  if (userIsAdmin(user)) {
    redirect('/ops')
  }

  const docs = getPortalDocs({ isAdmin: false }).slice(0, 4)

  const cards = [
    {
      description: 'Your account is ready to use',
      footer: 'You can sign back in here any time.',
      title: 'Account status',
      trend: 'Active',
      value: 'Ready',
    },
    {
      description: 'Read prep details before service day',
      footer: 'The docs area keeps the current guidance in one place.',
      title: 'Customer docs',
      trend: `${docs.length} guides`,
      value: String(docs.length),
    },
    {
      description: 'Scheduling is handled through the booking flow',
      footer: 'Use the scheduling page when you are ready.',
      title: 'Scheduling',
      trend: 'Open',
      value: 'Book now',
    },
    {
      description: 'Support is available through the contact flow',
      footer: 'Reply to your quote email if you need a change.',
      title: 'Help',
      trend: 'Available',
      value: 'Contact us',
    },
  ] satisfies SectionCardItem[]

  return <CustomerDashboardView cards={cards} docs={docs} />
}
