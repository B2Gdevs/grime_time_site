'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDaysIcon, CheckCircle2Icon, LoaderCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { postJsonForm } from '@/lib/forms/api'
import {
  schedulePropertyOptions,
  scheduleRequestSchema,
  scheduleServiceOptions,
  scheduleWindowOptions,
  type ScheduleRequestValues,
} from '@/lib/forms/scheduleRequest'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type ScheduleRequestResponse = {
  message: string
  ok: boolean
  submissionId: number | string
}

const defaultValues: ScheduleRequestValues = {
  approximateSize: '',
  email: '',
  fullName: '',
  notes: '',
  phone: '',
  preferredWindow: 'flexible',
  propertyAddress: '',
  propertyType: 'residential',
  requestedService: 'house_wash',
  targetDate: '',
}

export function ScheduleRequestForm() {
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<ScheduleRequestValues>({
    resolver: zodResolver(scheduleRequestSchema),
    defaultValues,
  })

  async function onSubmit(values: ScheduleRequestValues) {
    setServerMessage(null)

    try {
      const response = await postJsonForm<ScheduleRequestValues, ScheduleRequestResponse>(
        '/api/lead-forms/schedule',
        values,
      )

      setSubmitted(true)
      setServerMessage(response.message)
      form.reset(defaultValues)
    } catch (error) {
      setSubmitted(false)
      setServerMessage(error instanceof Error ? error.message : 'Could not send the request.')
    }
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-[1.5rem] border border-border/80 bg-background/84 p-5 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="grid gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
              Schedule request
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">Tell us what you need</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              We will save the lead in Payload and push it into EngageBay for follow-up, ownership,
              and scheduling.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/90 p-3 text-primary">
            <CalendarDaysIcon className="size-5" />
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
                    <FormDescription>Use a number we can call or text about access and arrival windows.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="propertyAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, ST" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <FormField
                control={form.control}
                name="requestedService"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested service</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scheduleServiceOptions.map((option) => (
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
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {schedulePropertyOptions.map((option) => (
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
                name="preferredWindow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred window</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a window" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scheduleWindowOptions.map((option) => (
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

            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_12rem]">
              <FormField
                control={form.control}
                name="approximateSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approximate size</FormLabel>
                    <FormControl>
                      <Input placeholder="1800 sq ft, 2-car driveway, etc." {...field} />
                    </FormControl>
                    <FormDescription>Helpful for scoping, not a locked measurement.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access notes or job details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about gates, algae, waterfront access, HOA restrictions, or anything that changes the scope."
                      rows={5}
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
                Request a scope review now. The team will confirm details before the schedule is locked.
              </p>
              <Button className="min-w-44" disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? (
                  <>
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Request scheduling'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
