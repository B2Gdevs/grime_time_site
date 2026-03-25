'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarClockIcon, CheckCircle2Icon, LoaderCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { arrivalWindowOptions } from '@/lib/services/constants'
import {
  type CustomerScheduleRequestInputValues,
  customerScheduleRequestSchema,
  type CustomerScheduleRequestValues,
} from '@/lib/forms/customerScheduleRequest'

type SelectOption = {
  label: string
  value: string
}

type Props = {
  appointmentOptions: SelectOption[]
  planOptions: SelectOption[]
  quoteOptions: SelectOption[]
}

const defaultValues: CustomerScheduleRequestInputValues = {
  existingAppointmentId: '',
  notes: '',
  preferredDate: '',
  quoteId: '',
  servicePlanId: '',
  window: 'flexible',
}

export function CustomerScheduleRequestForm({
  appointmentOptions,
  planOptions,
  quoteOptions,
}: Props) {
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<CustomerScheduleRequestInputValues, unknown, CustomerScheduleRequestValues>({
    resolver: zodResolver(customerScheduleRequestSchema),
    defaultValues,
  })

  async function onSubmit(values: CustomerScheduleRequestValues) {
    setSubmitted(false)
    setServerMessage(null)

    try {
      const response = await fetch('/api/portal/service-appointments', {
        body: JSON.stringify({
          ...values,
          existingAppointmentId:
            values.existingAppointmentId === 'none' ? '' : values.existingAppointmentId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
      if (!response.ok) {
        throw new Error(body.error || 'Could not save the scheduling request.')
      }

      setSubmitted(true)
      setServerMessage(body.message || 'Scheduling request submitted.')
      form.reset(defaultValues)
    } catch (error) {
      setSubmitted(false)
      setServerMessage(error instanceof Error ? error.message : 'Could not save the scheduling request.')
    }
  }

  return (
    <Form {...form}>
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="existingAppointmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Change an existing visit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'none'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a scheduled visit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No existing visit</SelectItem>
                    {appointmentOptions.map((option) => (
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
            name="window"
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
                    {arrivalWindowOptions.map((option) => (
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

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="quoteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimate to schedule from</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                  value={field.value || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an estimate" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No estimate selected</SelectItem>
                    {quoteOptions.map((option) => (
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
            name="servicePlanId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recurring plan</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                  value={field.value || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a plan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No plan selected</SelectItem>
                    {planOptions.map((option) => (
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
          name="preferredDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred date</FormLabel>
              <FormControl>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                  type="date"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schedule notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Tell us about access, blackout dates, or anything that should change for this visit."
                  rows={5}
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
          <p className="text-sm text-muted-foreground">
            Pick an existing visit to request a change, or choose an accepted estimate / plan to schedule a new stop.
          </p>
          <Button disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? (
              <>
                <LoaderCircleIcon className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CalendarClockIcon className="size-4" />
                Submit schedule request
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
