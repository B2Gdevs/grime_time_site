import { Suspense } from 'react'

import { LoginBrandMark, LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <LoginBrandMark />
        <Suspense fallback={<div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Loading login…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
