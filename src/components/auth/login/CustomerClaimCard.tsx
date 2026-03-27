import { ClaimAccountForm } from '@/components/auth/login/ClaimAccountForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  claimToken: null | string
  nextPath: string
}

export function CustomerClaimCard({ claimToken, nextPath }: Props) {
  const hasToken = Boolean(claimToken)

  return (
    <Card className="shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {hasToken ? 'Claim your account' : 'Request your claim link'}
        </CardTitle>
        <CardDescription>
          {hasToken
            ? 'Finish secure access for estimates, invoices, scheduling, and company access.'
            : 'Use the same email already on file and we will send a secure claim link.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ClaimAccountForm claimToken={claimToken} nextPath={nextPath} />
      </CardContent>
    </Card>
  )
}
