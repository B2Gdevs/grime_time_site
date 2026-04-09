import { CustomerDashboardView } from '@/components/portal/CustomerDashboardView'
import type { SectionCardItem } from '@/components/section-cards'
import { getCurrentAuthContext } from '@/lib/auth/getAuthContext'
import { getCustomerPortalData } from '@/lib/customers/getCustomerPortalData'
import { formatDate } from '@/lib/customers/format'

export default async function CustomerDashboardPage() {
  const auth = await getCurrentAuthContext()
  const user = auth.effectiveUser

  if (!user) {
    return null
  }

  const isAdminPreview = auth.isRealAdmin
  const portal = await getCustomerPortalData(user)
  const nextAppointment = portal.appointments[0]
  const openInvoices = portal.invoices.filter(
    (invoice) => invoice.status === 'open' || invoice.status === 'overdue',
  )

  const cards = [
    {
      description: 'Portal-ready quote records tied to your account',
      footer: 'Use estimates to review recent pricing before you schedule.',
      title: 'Estimates',
      trend: `${portal.estimates.length} total`,
      value: String(portal.estimates.length),
    },
    {
      description: 'Open invoice balances and payment-ready records',
      footer: 'Billing links stay inside the invoices area when available.',
      title: 'Invoices',
      trend: `${openInvoices.length} open`,
      value: String(portal.invoices.length),
    },
    {
      description: nextAppointment
        ? 'The next visit or request already tied to your account'
        : 'No visit is scheduled yet for this account',
      footer: nextAppointment
        ? `Current date: ${formatDate(nextAppointment.scheduledStart || nextAppointment.requestedDate)}`
        : 'Use the schedule area after an accepted quote or plan is in place.',
      title: 'Next visit',
      trend: nextAppointment ? nextAppointment.status : 'Needs request',
      value: nextAppointment ? formatDate(nextAppointment.scheduledStart || nextAppointment.requestedDate) : 'Pending',
    },
    {
      description: 'Contact details and service addresses used across the portal',
      footer: 'Update your account if the phone or address is out of date.',
      title: 'Account',
      trend:
        portal.profileCompleteness.contactReady && portal.profileCompleteness.addressReady
          ? 'Ready'
          : 'Needs update',
      value:
        portal.profileCompleteness.contactReady && portal.profileCompleteness.addressReady
          ? 'Ready'
          : 'Review',
    },
  ] satisfies SectionCardItem[]

  return <CustomerDashboardView cards={cards} portal={portal} isAdminPreview={isAdminPreview} />
}
