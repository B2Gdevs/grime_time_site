import { z } from 'zod'

import {
  leadEmailSchema,
  optionalPhoneSchema,
  optionalTrimmedString,
  requiredTrimmedString,
} from '@/lib/forms/shared'

export const contactServiceOptions = [
  { label: 'House wash', value: 'house_wash' },
  { label: 'Driveway / concrete', value: 'driveway_concrete' },
  { label: 'Deck / porch', value: 'deck_porch' },
  { label: 'Dock / waterfront', value: 'dock_waterfront' },
  { label: 'Commercial question', value: 'commercial_question' },
  { label: 'General question', value: 'general_question' },
] as const

export const preferredReplyOptions = [
  { label: 'Email me back', value: 'email' },
  { label: 'Call me', value: 'call' },
  { label: 'Text me', value: 'text' },
] as const

export const CONTACT_REQUEST_FORM_TITLE = 'Contact Form'

export const contactRequestSchema = z.object({
  fullName: requiredTrimmedString(2, 120, 'Enter your name.'),
  email: leadEmailSchema,
  phone: optionalPhoneSchema,
  propertyAddress: optionalTrimmedString(220),
  preferredReply: z.enum(preferredReplyOptions.map((option) => option.value)),
  requestedService: z.enum(contactServiceOptions.map((option) => option.value)),
  message: requiredTrimmedString(10, 1400, 'Enter a short message so we know what you need.'),
})

export type ContactRequestValues = z.infer<typeof contactRequestSchema>

export function contactRequestToSubmissionRows(values: ContactRequestValues) {
  const serviceLabel =
    contactServiceOptions.find((option) => option.value === values.requestedService)?.label ??
    values.requestedService
  const preferredReplyLabel =
    preferredReplyOptions.find((option) => option.value === values.preferredReply)?.label ??
    values.preferredReply

  return [
    { field: 'fullName', value: values.fullName },
    { field: 'email', value: values.email },
    { field: 'phone', value: values.phone },
    { field: 'serviceType', value: serviceLabel },
    { field: 'preferredReply', value: preferredReplyLabel },
    { field: 'propertyAddress', value: values.propertyAddress },
    { field: 'message', value: values.message },
    { field: 'leadSource', value: 'contact_request' },
  ].filter((row) => row.value.trim().length > 0)
}
