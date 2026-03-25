'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2Icon, LoaderCircleIcon, MessageSquareTextIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

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
          ? 'Message saved. CRM sync needs attention, but the team still has your request in Payload.'
          : response.message,
      )
      form.reset(defaultValues)
    } catch (error) {
      setSubmitted(false)
      setServerMessage(error instanceof Error ? error.message : 'Could not send the request.')
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-border/80 bg-background/88 p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="grid gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">Contact</p>
          <h2 className="text-2xl font-semibold tracking-tight">Send the team a real request</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            This goes straight into Payload and the CRM follow-up queue. Use it for support,
            billing, privacy, policy, or service questions that are not just a quote request.
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/90 p-3 text-primary">
          <MessageSquareTextIcon className="size-5" />
        </div>
      </div>

      <Form {...form}>
        <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-5 md:grid-cols-2">
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

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 555-5555" type="tel" {...field} />
                  </FormControl>
                  <FormDescription>Optional, but useful if you want a call or text back.</FormDescription>
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
                  <FormDescription>Helpful if this question is tied to a specific property.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="requestedService"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What is this about?</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a topic" />
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredReply"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How should we reply?</FormLabel>
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

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us what you need, whether it is support, billing, privacy, policy, scheduling, or a service question."
                    rows={6}
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-muted-foreground">
              We use this to create a real follow-up record for support, billing, privacy, and service questions.
            </p>
            <Button className="min-w-44" disabled={form.formState.isSubmitting} type="submit">
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
