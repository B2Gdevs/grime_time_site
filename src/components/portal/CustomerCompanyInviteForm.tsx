'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon, MailPlusIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { AuthError } from '@/components/auth/auth-error'
import { AuthNotice } from '@/components/auth/AuthNotice'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { companyInviteSchema, type CompanyInviteValues } from '@/lib/forms/portalAccess'
import { queryKeys } from '@/lib/query/queryKeys'
import { requestJson } from '@/lib/query/request'

type Props = {
  accountName: string
}

export function CustomerCompanyInviteForm({ accountName }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverNotice, setServerNotice] = useState<string | null>(null)
  const form = useForm<CompanyInviteValues>({
    defaultValues: {
      email: '',
      name: '',
    },
    resolver: zodResolver(companyInviteSchema),
  })

  const inviteMutation = useMutation({
    mutationFn: (values: CompanyInviteValues) =>
      requestJson<{ message?: string }>('/api/portal/account/invitations', {
        body: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    onError: (error) => {
      setServerError(error instanceof Error ? error.message : 'Could not send that invite right now.')
    },
    onSuccess: async (body) => {
      form.reset()
      setServerNotice(body.message || `Invite sent for ${accountName}.`)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.companyAccess,
      })
      router.refresh()
    },
  })

  async function onSubmit(values: CompanyInviteValues) {
    setServerError(null)
    setServerNotice(null)

    await inviteMutation.mutateAsync(values)
  }

  return (
    <Form {...form}>
      <form className="grid gap-4 rounded-2xl border p-4" noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <h3 className="font-medium">Invite a teammate</h3>
          <p className="text-sm text-muted-foreground">
            Send a secure company-access link for {accountName}. They will finish setup with the
            same email through Grime Time hosted sign-in.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Teammate name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="teammate@example.com" type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {serverError ? <AuthError message={serverError} /> : null}
        {serverNotice ? <AuthNotice message={serverNotice} /> : null}
        <div className="flex justify-end">
          <Button disabled={inviteMutation.isPending} type="submit">
            {inviteMutation.isPending ? (
              <>
                <LoaderCircleIcon className="size-4 animate-spin" />
                Sending invite...
              </>
            ) : (
              <>
                <MailPlusIcon className="size-4" />
                Send invite
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
