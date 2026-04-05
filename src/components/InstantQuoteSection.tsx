'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarDaysIcon,
  CameraIcon,
  DropletsIcon,
  GaugeIcon,
  LoaderCircleIcon,
  MailIcon,
  PhoneIcon,
  RulerIcon,
  SparklesIcon,
  UserIcon,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { NoiseBackground } from '@/components/NoiseBackground'
import { useSiteTour } from '@/components/tours/SiteTourProvider'
import { useDemoMode } from '@/providers/DemoModeProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { postJsonForm, postMultipartForm } from '@/lib/forms/api'
import {
  INSTANT_QUOTE_ATTACHMENT_MAX_FILES,
  INSTANT_QUOTE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  validateInstantQuoteAttachmentBatch,
} from '@/lib/forms/instantQuoteAttachments'
import {
  buildInstantQuoteEstimate,
  instantQuoteConditionOptions,
  instantQuoteFrequencyOptions,
  instantQuoteRequestSchema,
  getInstantQuoteServiceSelectOptions,
  instantQuoteStoriesOptions,
  type InstantQuoteRequestValues,
} from '@/lib/forms/instantQuoteRequest'
import { schedulePropertyOptions, scheduleWindowOptions } from '@/lib/forms/scheduleRequest'
import {
  formatCurrency,
  getDefaultInstantQuoteServiceKey,
  getInstantQuoteMeasurementConfig,
  getInstantQuoteService,
  type InstantQuoteCatalog,
} from '@/lib/quotes/instantQuoteCatalog'

type QuoteResponse = {
  attachmentCount?: number
  attachmentSyncStatus?: 'failed' | 'saved'
  crmSyncStatus: string | null
  message: string
  ok: boolean
  submissionId: number | string
}

type InstantQuoteFormValues = z.input<typeof instantQuoteRequestSchema>

export function InstantQuoteSection({ catalog }: { catalog: InstantQuoteCatalog }) {
  const pathname = usePathname()
  const router = useRouter()
  const { demoMode } = useDemoMode()
  const { startTour } = useSiteTour()
  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentInputKey, setAttachmentInputKey] = useState(0)
  const [attachmentIssues, setAttachmentIssues] = useState<string[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const serviceOptions = useMemo(() => getInstantQuoteServiceSelectOptions(catalog), [catalog])
  const defaultServiceKey = useMemo(() => getDefaultInstantQuoteServiceKey(catalog), [catalog])
  const defaultMeasurement = useMemo(
    () => getInstantQuoteMeasurementConfig(defaultServiceKey, catalog).placeholder,
    [catalog, defaultServiceKey],
  )
  const defaultValues = useMemo<InstantQuoteFormValues>(
    () => ({
      address: '',
      condition: 'standard',
      details: '',
      email: '',
      frequency: 'one_time',
      fullName: '',
      phone: '',
      requestScheduling: false,
      scheduleApproximateSize: '',
      schedulingNotes: '',
      schedulingPreferredWindow: 'flexible',
      schedulingPropertyType: 'residential',
      schedulingTargetDate: '',
      serviceKey: defaultServiceKey,
      sqft: defaultMeasurement,
      stories: '1',
    }),
    [defaultMeasurement, defaultServiceKey],
  )

  const form = useForm<InstantQuoteFormValues>({
    resolver: zodResolver(instantQuoteRequestSchema),
    defaultValues,
  })

  const values = useWatch({ control: form.control }) as InstantQuoteFormValues
  const requestScheduling = useWatch({ control: form.control, name: 'requestScheduling' }) ?? false
  const estimate = buildInstantQuoteEstimate(values as InstantQuoteRequestValues, catalog)
  const measurementConfig = useMemo(
    () => getInstantQuoteMeasurementConfig(values.serviceKey, catalog),
    [catalog, values.serviceKey],
  )
  const estimateHeading =
    estimate.kind === 'manual-review'
      ? 'Staff-reviewed quote'
      : estimate.kind === 'starting-price'
        ? formatCurrency(estimate.low || 0)
        : `${formatCurrency(estimate.low || 0)} to ${formatCurrency(estimate.high || 0)}`
  const estimateLabel =
    estimate.kind === 'manual-review'
      ? 'Review required'
      : estimate.kind === 'starting-price'
        ? 'Starting estimate'
        : 'Live range'
  const estimateDriverCopy =
    values.serviceKey === 'house_wash'
      ? 'Exterior wall count, story height, and visible buildup.'
      : values.serviceKey === 'driveway'
        ? 'Square footage, buildup, water access, and flatwork layout.'
        : values.serviceKey === 'dock'
          ? 'Square footage, algae severity, stairs, rails, and waterside access.'
          : 'Square footage, condition, and the complexity of the surface mix.'
  const estimateReviewCopy =
    values.serviceKey === 'house_wash'
      ? catalog.houseWashPricing.manualReviewNote
      : values.serviceKey === 'driveway'
        ? catalog.messaging.drivewayPhotoNote
        : values.serviceKey === 'dock' || values.serviceKey === 'dumpster_pad'
          ? catalog.messaging.commercialExpansionNote
          : catalog.messaging.waterAccessNote
  const attachmentReviewCopy =
    values.serviceKey === 'driveway'
      ? catalog.messaging.drivewayPhotoNote
      : values.serviceKey === 'house_wash'
        ? 'Optional photos help us confirm wall count, buildup, and access before follow-up.'
        : 'Optional photos help staff confirm access, buildup, and any mixed-surface complexity.'

  function resetAttachments() {
    setAttachments([])
    setAttachmentIssues([])
    setAttachmentInputKey((current) => current + 1)
  }

  function setSelectedAttachments(nextAttachments: File[]) {
    setAttachments(nextAttachments)
    setAttachmentIssues(validateInstantQuoteAttachmentBatch(nextAttachments))
  }

  async function onSubmit(submission: InstantQuoteFormValues) {
    setError(null)
    setFeedback(null)

    const nextAttachmentIssues = validateInstantQuoteAttachmentBatch(attachments)
    setAttachmentIssues(nextAttachmentIssues)

    if (nextAttachmentIssues.length > 0) {
      setError(nextAttachmentIssues[0] || 'Fix the selected images before sending the request.')
      return
    }

    try {
      const response =
        attachments.length > 0
          ? await (() => {
              const formData = new FormData()
              formData.set('payload', JSON.stringify(submission))
              for (const attachment of attachments) {
                formData.append('attachments', attachment)
              }
              return postMultipartForm<QuoteResponse>('/api/lead-forms/instant-quote', formData)
            })()
          : await postJsonForm<InstantQuoteFormValues, QuoteResponse>(
              '/api/lead-forms/instant-quote',
              submission,
            )

      setFeedback(
        response.crmSyncStatus === 'failed_contact'
          ? 'Estimate request saved. The internal follow-up workflow needs attention, but the team still has your request in Payload.'
          : response.message,
      )
      form.reset(defaultValues)
      resetAttachments()
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Could not submit your quote request.',
      )
    }
  }

  function startInstantQuoteTour() {
    if (pathname === '/') {
      document.getElementById('instant-quote')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(() => startTour('public-instant-quote'), 450)
    } else {
      router.push('/?tour=public-instant-quote#instant-quote')
    }
  }

  return (
    <section className="container my-20 scroll-mt-24" id="instant-quote">
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-card via-card to-secondary/40 shadow-[0_20px_80px_-50px_rgba(15,23,42,0.55)] dark:border-slate-700 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <NoiseBackground className="opacity-85 dark:hidden" contrast="light" />
        <NoiseBackground className="hidden opacity-55 dark:block" contrast="dark" />

        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div
            className="relative border-b border-border/70 p-6 dark:border-slate-700 dark:bg-slate-900/75 lg:border-b-0 lg:border-r lg:p-8"
            data-tour="public-instant-quote-hero"
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge variant="outline">Fast estimate</Badge>
              {demoMode ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={startInstantQuoteTour}
                >
                  Quick tour
                </Button>
              ) : null}
            </div>
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
              Instant quote range in under a minute
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground dark:text-slate-300">
              Pick service, size, and condition. You get honest starting guidance now; we confirm final
              scope after review.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {serviceOptions.map((item) => {
                const catalogItem = getInstantQuoteService(item.value, catalog)
                const selected = item.value === values.serviceKey

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => form.setValue('serviceKey', item.value, { shouldValidate: true })}
                    className={`rounded-xl border p-3 text-left transition ${
                      selected
                        ? 'border-primary bg-primary/10 shadow-sm dark:bg-primary/20'
                        : 'border-border bg-background/70 hover:border-primary/40 dark:border-slate-700 dark:bg-slate-900/90 dark:hover:border-primary/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold">{catalogItem.label}</h3>
                      <Badge variant={selected ? 'default' : 'outline'}>
                        {catalogItem.priceBandLabel}
                      </Badge>
                    </div>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground dark:text-slate-300">
                      Minimum {formatCurrency(catalogItem.minimum)}
                    </p>
                  </button>
                )
              })}
            </div>

            <Card className="mt-5 border-primary/20 bg-primary/5 shadow-none dark:border-primary/40 dark:bg-slate-900/95">
              <CardHeader className="pb-2">
                <CardDescription className="dark:text-slate-300">{estimateLabel}</CardDescription>
                <CardTitle className="text-3xl">{estimateHeading}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-muted-foreground dark:text-slate-300 sm:grid-cols-2">
                <div>
                  <p className="font-medium text-foreground">What drives it</p>
                  <p>{estimateDriverCopy}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Review note</p>
                  <p>{estimateReviewCopy}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative bg-background/30 p-6 dark:bg-slate-950/85 lg:p-8" data-tour="public-instant-quote-form">
            <Form {...form}>
              <form
                className="grid gap-4 text-foreground dark:text-slate-100 [&_input]:dark:border-slate-700 [&_input]:dark:bg-slate-950/95 [&_input]:dark:text-slate-100 [&_input::placeholder]:dark:text-slate-400 [&_textarea]:dark:border-slate-700 [&_textarea]:dark:bg-slate-950/95 [&_textarea]:dark:text-slate-100 [&_textarea::placeholder]:dark:text-slate-400"
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="serviceKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="inline-flex items-center gap-1.5">
                          <DropletsIcon className="size-3.5 text-primary" />
                          Service
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="dark:border-slate-700 dark:bg-slate-950/95 dark:text-slate-100">
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
                        <FormLabel className="inline-flex items-center gap-1.5">
                          <RulerIcon className="size-3.5 text-primary" />
                          {measurementConfig.label}
                        </FormLabel>
                        <FormControl>
                          <Input
                            inputMode="decimal"
                            min="1"
                            placeholder={measurementConfig.placeholder}
                            type="number"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>{measurementConfig.description}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="stories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="inline-flex items-center gap-1.5">
                          <GaugeIcon className="size-3.5 text-primary" />
                          Stories
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="dark:border-slate-700 dark:bg-slate-950/95 dark:text-slate-100">
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
                            <SelectTrigger className="dark:border-slate-700 dark:bg-slate-950/95 dark:text-slate-100">
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
                            <SelectTrigger className="dark:border-slate-700 dark:bg-slate-950/95 dark:text-slate-100">
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="inline-flex items-center gap-1.5">
                          <UserIcon className="size-3.5 text-primary" />
                          Full name
                        </FormLabel>
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
                        <FormLabel className="inline-flex items-center gap-1.5">
                          <MailIcon className="size-3.5 text-primary" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="you@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="inline-flex items-center gap-1.5">
                          <PhoneIcon className="size-3.5 text-primary" />
                          Phone
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 555-5555" type="tel" {...field} />
                        </FormControl>
                        <FormDescription>
                          {requestScheduling
                            ? 'Required when you request scheduling.'
                            : 'Optional'}
                        </FormDescription>
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
                        <FormDescription>
                          {requestScheduling
                            ? 'Required when you request scheduling.'
                            : 'Optional'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="requestScheduling"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 rounded-2xl border border-border/80 bg-muted/30 p-4 dark:border-slate-700 dark:bg-slate-900/95">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked: boolean | 'indeterminate') =>
                            field.onChange(checked === true)
                          }
                        />
                      </FormControl>
                      <div className="grid gap-1.5 leading-snug">
                        <FormLabel className="flex cursor-pointer items-center gap-2 font-medium">
                          <CalendarDaysIcon className="size-4 text-primary" />
                          Also request scheduling
                        </FormLabel>
                        <FormDescription className="text-xs leading-5">
                          Add a preferred window and property context. Phone and address are required when
                          this is on.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {requestScheduling ? (
                  <div className="grid gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 dark:border-primary/40 dark:bg-slate-900/95">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="schedulingPropertyType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="dark:border-slate-700 dark:bg-slate-950/95 dark:text-slate-100">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {schedulePropertyOptions.map((item) => (
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
                        name="schedulingPreferredWindow"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred window</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="dark:border-slate-700 dark:bg-slate-950/95 dark:text-slate-100">
                                  <SelectValue placeholder="Select window" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {scheduleWindowOptions.map((item) => (
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
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="schedulingTargetDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred date (optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="scheduleApproximateSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Approximate site scope (optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Driveway length, fence line, etc."
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Helpful for scoping; not a locked measurement.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="schedulingNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access notes or job details (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Gates, algae, HOA restrictions, arrival preferences."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : null}

                <div className="grid gap-3 rounded-2xl border border-dashed border-primary/35 bg-primary/5 p-4 dark:border-primary/45 dark:bg-slate-900/95">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Optional job photos</p>
                      <p className="text-xs leading-5 text-muted-foreground dark:text-slate-300">
                        Saved for staff review only. Upload up to {INSTANT_QUOTE_ATTACHMENT_MAX_FILES}{' '}
                        images, {Math.round(INSTANT_QUOTE_ATTACHMENT_MAX_FILE_SIZE_BYTES / (1024 * 1024))}
                        MB each.
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground dark:text-slate-300">
                        {attachmentReviewCopy}
                      </p>
                    </div>
                    {attachments.length > 0 ? (
                      <Badge variant="outline">{attachments.length} selected</Badge>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button asChild type="button" variant="outline">
                      <label className="cursor-pointer" htmlFor="instant-quote-attachments">
                        <CameraIcon className="size-4" />
                        Choose images
                      </label>
                    </Button>
                    {attachments.length > 0 ? (
                      <Button type="button" variant="ghost" onClick={resetAttachments}>
                        Clear images
                      </Button>
                    ) : null}
                  </div>

                  <input
                    accept="image/*"
                    aria-label="Optional job photos"
                    className="sr-only"
                    id="instant-quote-attachments"
                    key={attachmentInputKey}
                    multiple
                    type="file"
                    onChange={(event) =>
                      setSelectedAttachments(Array.from(event.target.files || []))
                    }
                  />

                  {attachments.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {attachments.map((attachment, index) => (
                        <div
                          key={`${attachment.name}-${attachment.size}-${index}`}
                          className="rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/90"
                        >
                          <p className="truncate font-medium text-foreground">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground dark:text-slate-300">
                            {(attachment.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {attachmentIssues.length > 0 ? (
                    <div className="grid gap-1 text-sm text-destructive">
                      {attachmentIssues.map((issue) => (
                        <p key={issue}>{issue}</p>
                      ))}
                    </div>
                  ) : null}
                </div>

                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Extra details (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Stains, algae, access notes, HOA rules."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                {feedback ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4 text-sm dark:border-primary/50 dark:bg-slate-900/95">
                    <SparklesIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-foreground">{feedback}</p>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground dark:text-slate-300">
                    {catalog.messaging.estimateDisclaimer}
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
