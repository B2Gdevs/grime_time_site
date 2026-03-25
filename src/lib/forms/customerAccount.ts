import { z } from 'zod'

import {
  leadEmailSchema,
  optionalPhoneSchema,
  optionalTrimmedString,
  requiredTrimmedString,
} from '@/lib/forms/shared'

const addressSchema = z.object({
  city: optionalTrimmedString(120),
  postalCode: optionalTrimmedString(32),
  state: optionalTrimmedString(32),
  street1: optionalTrimmedString(180),
  street2: optionalTrimmedString(180),
})

export const customerAccountSchema = z.object({
  billingAddress: addressSchema,
  company: optionalTrimmedString(120),
  email: leadEmailSchema,
  name: requiredTrimmedString(2, 120, 'Enter your name.'),
  phone: optionalPhoneSchema,
  serviceAddress: addressSchema,
})

export type CustomerAccountValues = z.infer<typeof customerAccountSchema>
