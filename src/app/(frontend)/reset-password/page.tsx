import { LoginBrandMark } from '@/components/auth/LoginBrandMark'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <LoginBrandMark />
        <ResetPasswordForm />
      </div>
    </div>
  )
}
