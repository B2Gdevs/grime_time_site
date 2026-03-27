import { LoginBrandMark } from '@/components/auth/LoginBrandMark'
import { CustomerClaimCard } from '@/components/auth/login/CustomerClaimCard'
import {
  PORTAL_ACCESS_DEFAULT_NEXT_PATH,
  PORTAL_ACCESS_TOKEN_QUERY_KEY,
} from '@/lib/auth/portal-access/constants'
import { sanitizeNextPath } from '@/lib/auth/redirect'

type ClaimAccountPageProps = {
  searchParams: Promise<{
    claim?: string
    next?: string
  }>
}

export default async function ClaimAccountPage({ searchParams }: ClaimAccountPageProps) {
  const sp = await searchParams
  const claimToken = sp[PORTAL_ACCESS_TOKEN_QUERY_KEY] || null
  const nextPath = sanitizeNextPath(sp.next) || PORTAL_ACCESS_DEFAULT_NEXT_PATH

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <LoginBrandMark />
        <CustomerClaimCard claimToken={claimToken} nextPath={nextPath} />
      </div>
    </div>
  )
}
