'use client'

import { CreateAccountForm } from '@/components/auth/login/CreateAccountForm'
import { MagicLinkSignInForm } from '@/components/auth/login/MagicLinkSignInForm'
import { PasswordSignInForm } from '@/components/auth/login/PasswordSignInForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Props = {
  nextPath: string
}

export function SupabaseCustomerLoginPanel({ nextPath }: Props) {
  return (
    <Tabs defaultValue="sign-in" className="grid gap-6">
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl p-1">
        <TabsTrigger value="sign-in">Password</TabsTrigger>
        <TabsTrigger value="magic-link">Magic link</TabsTrigger>
        <TabsTrigger value="create-account">Create account</TabsTrigger>
      </TabsList>
      <TabsContent value="sign-in">
        <PasswordSignInForm nextPath={nextPath} />
      </TabsContent>
      <TabsContent value="magic-link">
        <MagicLinkSignInForm nextPath={nextPath} />
      </TabsContent>
      <TabsContent value="create-account">
        <CreateAccountForm />
      </TabsContent>
    </Tabs>
  )
}
