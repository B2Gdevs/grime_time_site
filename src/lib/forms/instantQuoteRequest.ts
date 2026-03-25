import { z } from 'zod'

import {
  buildInstantQuoteServiceOptions,
  calculateInstantQuote,
  defaultInstantQuoteCatalog,
  formatCurrency,
  getInstantQuoteService,
  instantQuoteServiceKeys,
  type InstantQuoteCatalog,
  type InstantQuoteCondition,
  type InstantQuoteFrequency,
  type InstantQuoteServiceKey,
  type InstantQuoteStories,
} from '@/lib/quotes/instantQuoteCatalog'
import { leadEmailSchema, optionalPhoneSchema, optionalTrimmedString, requiredTrimmedString } from '@/lib/forms/shared'

export const INSTANT_QUOTE_REQUEST_FORM_TITLE = 'Instant Quote Form'

export const instantQuoteServiceOptions = buildInstantQuoteServiceOptions(defaultInstantQuoteCatalog)

export const instantQuoteStoriesOptions = [
  { label: '1 story', value: '1' },
  { label: '2 stories', value: '2' },
  { label: '3+ stories', value: '3+' },
] as const

export const instantQuoteConditionOptions = [
  { label: 'Light buildup', value: 'light' },
  { label: 'Standard soil', value: 'standard' },
  { label: 'Heavy organic growth', value: 'heavy' },
] as const

export const instantQuoteFrequencyOptions = [
  { label: 'One-time service', value: 'one_time' },
  { label: '2x per year', value: 'biannual' },
  { label: 'Quarterly plan', value: 'quarterly' },
] as const

export const instantQuoteRequestSchema = z.object({
  serviceKey: z.enum(instantQuoteServiceKeys),
  sqft: requiredTrimmedString(1, 20, 'Enter the approximate square footage.').refine(
    (value) => {
      const parsed = Number.parseFloat(value)
      return Number.isFinite(parsed) && parsed > 0 && parsed <= 250000
    },
    { message: 'Enter a valid square-footage estimate.' },
  ),
  stories: z.enum(instantQuoteStoriesOptions.map((option) => option.value)),
  condition: z.enum(instantQuoteConditionOptions.map((option) => option.value)),
  frequency: z.enum(instantQuoteFrequencyOptions.map((option) => option.value)),
  fullName: requiredTrimmedString(2, 120, 'Enter your name.'),
  email: leadEmailSchema,
  phone: optionalPhoneSchema,
  address: optionalTrimmedString(220),
  details: optionalTrimmedString(1400),
})

export type InstantQuoteRequestValues = z.infer<typeof instantQuoteRequestSchema>

export function getInstantQuoteServiceSelectOptions(catalog: InstantQuoteCatalog) {
  return buildInstantQuoteServiceOptions(catalog)
}

export function buildInstantQuoteEstimate(
  values: InstantQuoteRequestValues,
  catalog: InstantQuoteCatalog = defaultInstantQuoteCatalog,
) {
  const sqft = Number.parseFloat(values.sqft)

  return calculateInstantQuote(
    {
      condition: values.condition as InstantQuoteCondition,
      frequency: values.frequency as InstantQuoteFrequency,
      serviceKey: values.serviceKey as InstantQuoteServiceKey,
      sqft: Number.isFinite(sqft) ? sqft : 0,
      stories: values.stories as InstantQuoteStories,
    },
    catalog,
  )
}

export function instantQuoteRequestToSubmissionRows(
  values: InstantQuoteRequestValues,
  catalog: InstantQuoteCatalog = defaultInstantQuoteCatalog,
) {
  const estimate = buildInstantQuoteEstimate(values, catalog)
  const service = getInstantQuoteService(values.serviceKey as InstantQuoteServiceKey, catalog)
  const storiesLabel =
    instantQuoteStoriesOptions.find((option) => option.value === values.stories)?.label ?? values.stories
  const conditionLabel =
    instantQuoteConditionOptions.find((option) => option.value === values.condition)?.label ?? values.condition
  const frequencyLabel =
    instantQuoteFrequencyOptions.find((option) => option.value === values.frequency)?.label ?? values.frequency

  return [
    { field: 'fullName', value: values.fullName },
    { field: 'email', value: values.email },
    { field: 'phone', value: values.phone },
    { field: 'serviceType', value: service.label },
    { field: 'propertyAddress', value: values.address },
    { field: 'serviceAreaSqft', value: values.sqft },
    { field: 'stories', value: storiesLabel },
    { field: 'condition', value: conditionLabel },
    { field: 'frequency', value: frequencyLabel },
    {
      field: 'estimatedRange',
      value: `${formatCurrency(estimate.low)} to ${formatCurrency(estimate.high)}`,
    },
    { field: 'details', value: values.details },
    { field: 'leadSource', value: 'instant_quote' },
  ].filter((row) => row.value.trim().length > 0)
}
