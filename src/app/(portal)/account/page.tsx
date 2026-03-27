import { CustomerAccountForm } from '@/components/portal/CustomerAccountForm'
import { CustomerBillingPortalCard } from '@/components/portal/CustomerBillingPortalCard'
import { CustomerCompanyAccessCard } from '@/components/portal/CustomerCompanyAccessCard'
import { SiteHeader } from '@/components/site-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentPayloadUser } from '@/lib/auth/getCurrentPayloadUser'
import { loadCompanyAccessSummary } from '@/lib/customers/companyAccess'
import { getCustomerPortalData } from '@/lib/customers/getCustomerPortalData'

export default async function AccountPage() {
  const user = await getCurrentPayloadUser()

  if (!user) {
    return null
  }

  const companyAccess = await loadCompanyAccessSummary(user)
  const portal = await getCustomerPortalData(user)

  return (
    <>
      <SiteHeader
        title="Account"
        description="Update the contact and address details that power your service records."
      />
      <div className="flex flex-1 flex-col px-4 py-6 lg:px-6" data-tour="portal-page-body">
        <Card>
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>Keep your account, billing, and service addresses current.</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerAccountForm
              defaultValues={{
                billingAddress: {
                  city: user.billingAddress?.city || '',
                  postalCode: user.billingAddress?.postalCode || '',
                  state: user.billingAddress?.state || '',
                  street1: user.billingAddress?.street1 || '',
                  street2: user.billingAddress?.street2 || '',
                },
                company: user.company || '',
                email: user.email,
                name: user.name || '',
                phone: user.phone || '',
                serviceAddress: {
                  city: user.serviceAddress?.city || '',
                  postalCode: user.serviceAddress?.postalCode || '',
                  state: user.serviceAddress?.state || '',
                  street1: user.serviceAddress?.street1 || '',
                  street2: user.serviceAddress?.street2 || '',
                },
              }}
            />
          </CardContent>
        </Card>
        <CustomerBillingPortalCard
          billingMode={portal.billing.billingMode}
          billingRollupMode={portal.billing.billingRollupMode}
          billingTermsDays={portal.billing.billingTermsDays}
          canManageInStripe={portal.billing.canManageInStripe}
          portalAccessMode={portal.billing.portalAccessMode}
        />
        {companyAccess ? <CustomerCompanyAccessCard summary={companyAccess} /> : null}
      </div>
    </>
  )
}
