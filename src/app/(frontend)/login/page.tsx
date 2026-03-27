import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { LoginBrandMark, LoginForm } from '@/components/login-form'
import { PORTAL_ACCESS_TOKEN_QUERY_KEY } from '@/lib/auth/portal-access/constants'

type LoginPageProps = {
  searchParams: Promise<{
    claim?: string
    next?: string
    tab?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams
  const claimToken = sp[PORTAL_ACCESS_TOKEN_QUERY_KEY]

  if (claimToken || sp.tab === 'claim-account') {
    const params = new URLSearchParams()

    if (claimToken) {
      params.set(PORTAL_ACCESS_TOKEN_QUERY_KEY, claimToken)
    }

    if (sp.next) {
      params.set('next', sp.next)
    }

    redirect(params.size > 0 ? `/claim-account?${params.toString()}` : '/claim-account')
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <LoginBrandMark />
        <Suspense
          fallback={
            <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
              Loading login…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
