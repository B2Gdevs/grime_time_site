'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2Icon, LoaderCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { postJsonForm } from '@/lib/forms/api'
import { contactRequestSchema, type ContactRequestValues } from '@/lib/forms/contactRequest'

type ContactResponse = {
  crmSyncStatus: string | null
  message: string
  ok: boolean
  submissionId: number | string
}

const defaultValues: ContactRequestValues = {
  email: '',
  fullName: '',
  message: '',
  phone: '',
  preferredReply: 'email',
  propertyAddress: '',
  requestedService: 'general_question',
}

export function ContactRequestForm() {
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<ContactRequestValues>({
    resolver: zodResolver(contactRequestSchema),
    defaultValues,
  })

  async function onSubmit(values: ContactRequestValues) {
    setServerMessage(null)

    try {
      const response = await postJsonForm<ContactRequestValues, ContactResponse>(
        '/api/lead-forms/contact',
        values,
      )

      setSubmitted(true)
      setServerMessage(
        response.crmSyncStatus === 'failed_contact'
          ? 'Message saved. The internal follow-up workflow needs attention, but the team still has your request in Payload.'
          : response.message,
      )
      form.reset(defaultValues)
    } catch (error) {
      setSubmitted(false)
      setServerMessage(error instanceof Error ? error.message : 'Could not send the request.')
    }
  }

  return (
    <Form {...form}>
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" autoComplete="name" {...field} />
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
                <Input placeholder="you@example.com" type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea placeholder="How can we help?" rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverMessage ? (
          <div
            className={
              submitted
                ? 'flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm'
                : 'rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'
            }
          >
            {submitted ? <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" /> : null}
            <div className={submitted ? 'text-foreground' : ''}>{serverMessage}</div>
          </div>
        ) : null}

        <Button className="w-full sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? (
            <>
              <LoaderCircleIcon className="size-4 animate-spin" />
              Sending…
            </>
          ) : (
            'Send'
          )}
        </Button>
      </form>
    </Form>
  )
}
