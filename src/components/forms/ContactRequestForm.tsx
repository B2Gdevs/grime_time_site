'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2Icon, LoaderCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Logo } from '@/components/Logo/Logo'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { postJsonForm } from '@/lib/forms/api'
import {
  contactRequestSchema,
  contactServiceOptions,
  preferredReplyOptions,
  type ContactRequestValues,
} from '@/lib/forms/contactRequest'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
    <div className="rounded-[1.2rem] border border-primary/20 bg-background p-4 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="grid min-w-0 gap-1.5">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">Contact</p>
          <h2 className="text-xl font-semibold tracking-tight">Send a quick message</h2>
          <p className="text-sm text-muted-foreground">We reply by email or phone.</p>
        </div>
        <Logo className="max-w-[10.5rem]" />
      </div>

      <Form {...form}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
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
                    <Input placeholder="you@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="requestedService"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose the closest topic" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contactServiceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Routes billing, refund, privacy, and service follow-up correctly.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredReply"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reply preference</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {preferredReplyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 555-5555" type="tel" {...field} />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="propertyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property address</FormLabel>
                  <FormControl>
                    <Input placeholder="Street address" {...field} />
                  </FormControl>
                  <FormDescription>Optional, but helpful for service or invoice questions.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us what you need."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {serverMessage ? (
            <div
              className={
                submitted
                  ? 'flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm'
                  : 'rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-4 text-sm text-destructive'
              }
            >
              {submitted ? <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" /> : null}
              <div className={submitted ? 'text-foreground' : ''}>{serverMessage}</div>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-muted-foreground">We usually reply within 1 business day.</p>
            <Button className="w-full min-w-44 shrink-0 sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? (
                <>
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send message'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
