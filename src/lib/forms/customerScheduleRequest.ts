import { z } from 'zod'

import { optionalTrimmedString } from '@/lib/forms/shared'
import { arrivalWindowOptions } from '@/lib/services/constants'

export const customerScheduleRequestSchema = z
  .object({
    existingAppointmentId: z.string().trim().default(''),
    notes: optionalTrimmedString(1200),
    preferredDate: z
      .string()
      .trim()
      .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
        message: 'Enter a valid preferred date.',
      }),
    quoteId: z.string().trim().default(''),
    servicePlanId: z.string().trim().default(''),
    window: z.enum(arrivalWindowOptions.map((option) => option.value)),
  })
  .refine(
    (value) => Boolean(value.existingAppointmentId || value.quoteId || value.servicePlanId),
    'Choose a related estimate, service plan, or existing visit.',
  )

export type CustomerScheduleRequestInputValues = z.input<typeof customerScheduleRequestSchema>
export type CustomerScheduleRequestValues = z.output<typeof customerScheduleRequestSchema>
