'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircleIcon, SparklesIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { NoiseBackground } from '@/components/NoiseBackground'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { postJsonForm } from '@/lib/forms/api'
import {
  buildInstantQuoteEstimate,
  instantQuoteConditionOptions,
  instantQuoteFrequencyOptions,
  instantQuoteRequestSchema,
  getInstantQuoteServiceSelectOptions,
  instantQuoteStoriesOptions,
  type InstantQuoteRequestValues,
} from '@/lib/forms/instantQuoteRequest'
import {
  formatCurrency,
  getDefaultInstantQuoteServiceKey,
  getInstantQuoteService,
  type InstantQuoteCatalog,
} from '@/lib/quotes/instantQuoteCatalog'

type QuoteResponse = {
  crmSyncStatus: string | null
  message: string
  ok: boolean
  submissionId: number | string
}

export function InstantQuoteSection({ catalog }: { catalog: InstantQuoteCatalog }) {
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const serviceOptions = useMemo(() => getInstantQuoteServiceSelectOptions(catalog), [catalog])
  const defaultValues = useMemo<InstantQuoteRequestValues>(
    () => ({
      address: '',
      condition: 'standard',
      details: '',
      email: '',
      frequency: 'one_time',
      fullName: '',
      phone: '',
      serviceKey: getDefaultInstantQuoteServiceKey(catalog),
      sqft: '1800',
      stories: '1',
    }),
    [catalog],
  )

  const form = useForm<InstantQuoteRequestValues>({
    resolver: zodResolver(instantQuoteRequestSchema),
    defaultValues,
  })

  const values = form.watch()
  const estimate = useMemo(
    () => buildInstantQuoteEstimate(values, catalog),
    [catalog, values.condition, values.frequency, values.serviceKey, values.sqft, values.stories],
  )
  const service = getInstantQuoteService(values.serviceKey, catalog)

  async function onSubmit(submission: InstantQuoteRequestValues) {
    setError(null)
    setFeedback(null)

    try {
      const response = await postJsonForm<InstantQuoteRequestValues, QuoteResponse>(
        '/api/lead-forms/instant-quote',
        submission,
      )

      setFeedback(
        response.crmSyncStatus === 'failed_contact'
          ? 'Estimate request saved. The internal follow-up workflow needs attention, but the team still has your request in Payload.'
          : response.message,
      )
      form.reset(defaultValues)
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Could not submit your quote request.',
      )
    }
  }

  return (
    <section className="container my-20 scroll-mt-24" id="instant-quote">
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-card via-card to-secondary/40 shadow-[0_20px_80px_-50px_rgba(15,23,42,0.55)]">
        <NoiseBackground className="opacity-85" contrast="light" />

        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative border-b border-border/70 p-8 lg:border-b-0 lg:border-r lg:p-10">
            <Badge variant="outline" className="mb-4">
              Fast estimate
            </Badge>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Instant quote range for house washing, driveways, porches, and docks
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Give us your service type, approximate square footage, and job condition. We will
              show a live range now, then push the request into our team workflow for a real scoped
              quote.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {serviceOptions.map((item) => {
                const catalogItem = getInstantQuoteService(item.value, catalog)
                const selected = item.value === values.serviceKey

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => form.setValue('serviceKey', item.value, { shouldValidate: true })}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-background/70 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold">{catalogItem.label}</h3>
                      <Badge variant={selected ? 'default' : 'outline'}>
                        {catalogItem.priceBandLabel}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {catalogItem.description}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Minimum {formatCurrency(catalogItem.minimum)}
                    </p>
                  </button>
                )
              })}
            </div>

            <Card className="mt-8 border-primary/20 bg-primary/5 shadow-none">
              <CardHeader className="pb-3">
                <CardDescription>Live range</CardDescription>
                <CardTitle className="text-4xl">
                  {formatCurrency(estimate.low)} to {formatCurrency(estimate.high)}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
                <div>
                  <p className="font-medium text-foreground">What drives it</p>
                  <p>Square footage, condition, stories, and recurrence discount.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Best fit</p>
                  <p>{service.recommendedFor}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Expectation</p>
                  <p>This is a starting range. Photos, access, and stain severity can move it.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative p-8 lg:p-10">
            <Form {...form}>
              <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="serviceKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceOptions.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
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
                    name="sqft"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approx. square footage</FormLabel>
                        <FormControl>
                          <Input
                            inputMode="decimal"
                            min="1"
                            type="number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="stories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stories</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {instantQuoteStoriesOptions.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
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
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {instantQuoteConditionOptions.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
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
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visit frequency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {instantQuoteFrequencyOptions.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
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

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 555-5555" type="tel" {...field} />
                        </FormControl>
                        <FormDescription>Optional, but helpful for quick scope confirmation.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormDescription>Optional for the instant range, helpful for the follow-up quote.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details we should know</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about stains, algae, accessibility, HOA rules, gates, or photos you plan to send."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                {feedback ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm">
                    <SparklesIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-foreground">{feedback}</p>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    By submitting, you are asking for a scoped estimate and follow-up by email or phone.
                  </p>
                  <Button disabled={form.formState.isSubmitting} type="submit">
                    {form.formState.isSubmitting ? (
                      <>
                        <LoaderCircleIcon className="size-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send estimate request'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  )
}
