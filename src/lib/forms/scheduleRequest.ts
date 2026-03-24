import { z } from 'zod'
import {
  leadEmailSchema,
  optionalTrimmedString,
  requiredPhoneSchema,
  requiredTrimmedString,
} from '@/lib/forms/shared'

export const scheduleServiceOptions = [
  { label: 'House wash', value: 'house_wash' },
  { label: 'Driveway / concrete', value: 'driveway_concrete' },
  { label: 'Deck / porch', value: 'deck_porch' },
  { label: 'Dock / waterfront', value: 'dock_waterfront' },
  { label: 'Commercial walkthrough', value: 'commercial_walkthrough' },
] as const

export const schedulePropertyOptions = [
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial' },
] as const

export const scheduleWindowOptions = [
  { label: 'Morning preferred', value: 'morning' },
  { label: 'Afternoon preferred', value: 'afternoon' },
  { label: 'Flexible', value: 'flexible' },
] as const

export const scheduleRequestSchema = z.object({
  fullName: requiredTrimmedString(2, 120, 'Enter your name.'),
  email: leadEmailSchema,
  phone: requiredPhoneSchema,
  propertyAddress: requiredTrimmedString(8, 220, 'Enter the service address.'),
  requestedService: z.enum(scheduleServiceOptions.map((option) => option.value)),
  propertyType: z.enum(schedulePropertyOptions.map((option) => option.value)),
  preferredWindow: z.enum(scheduleWindowOptions.map((option) => option.value)),
  approximateSize: optionalTrimmedString(80),
  targetDate: z
    .string()
    .trim()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
      message: 'Enter a valid preferred date.',
    }),
  notes: optionalTrimmedString(1200),
})

export type ScheduleRequestValues = z.infer<typeof scheduleRequestSchema>

export const SCHEDULE_REQUEST_FORM_TITLE = 'Schedule Request Form'

export function scheduleRequestToSubmissionRows(values: ScheduleRequestValues) {
  const serviceLabel =
    scheduleServiceOptions.find((option) => option.value === values.requestedService)?.label ??
    values.requestedService
  const propertyTypeLabel =
    schedulePropertyOptions.find((option) => option.value === values.propertyType)?.label ??
    values.propertyType
  const preferredWindowLabel =
    scheduleWindowOptions.find((option) => option.value === values.preferredWindow)?.label ??
    values.preferredWindow

  return [
    { field: 'fullName', value: values.fullName },
    { field: 'email', value: values.email },
    { field: 'phone', value: values.phone },
    { field: 'serviceType', value: serviceLabel },
    { field: 'propertyType', value: propertyTypeLabel },
    { field: 'propertyAddress', value: values.propertyAddress },
    { field: 'preferredWindow', value: preferredWindowLabel },
    { field: 'targetDate', value: values.targetDate },
    { field: 'approximateSize', value: values.approximateSize },
    { field: 'notes', value: values.notes },
    { field: 'leadSource', value: 'schedule_request' },
  ].filter((row) => row.value.trim().length > 0)
}
