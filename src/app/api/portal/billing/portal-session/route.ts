import { requireEffectivePayloadUser } from '@/lib/auth/requirePayloadUser'
import { createStripePortalSession } from '@/lib/billing/stripe/portal'
import { getCurrentCustomerAccount } from '@/lib/customers/getCurrentCustomerAccount'

export async function POST(request: Request) {
  const auth = await requireEffectivePayloadUser(request)

  if (!auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const account = await getCurrentCustomerAccount({
    payload: auth.payload,
    user: auth.user,
  })

  if (!account) {
    return Response.json({ error: 'No account is linked to this user yet.' }, { status: 404 })
  }

  if (account.portalAccessMode === 'none') {
    return Response.json({ error: 'Stripe billing portal access is disabled for this account.' }, { status: 400 })
  }

  const body = (await request.json().catch(() => null)) as null | {
    returnPath?: string
  }

  const url = await createStripePortalSession({
    account,
    payload: auth.payload,
    returnPath: body?.returnPath || '/account',
    user: auth.user,
  })

  return Response.json({ url })
}
