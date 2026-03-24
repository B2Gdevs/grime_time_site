import { z } from 'zod'

export function optionalTrimmedString(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || '')
}

export function requiredTrimmedString(min: number, max: number, message: string) {
  return z.string().trim().min(min, message).max(max)
}

export const leadEmailSchema = z.email('Enter a valid email address.').trim().max(160)

export const requiredPhoneSchema = z
  .string()
  .trim()
  .min(10, 'Enter a phone number we can call or text.')
  .refine((value) => value.replace(/\D/g, '').length >= 10, {
    message: 'Enter a valid phone number.',
  })

export const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((value) => !value || value.replace(/\D/g, '').length >= 10, {
    message: 'Enter a valid phone number.',
  })
  .transform((value) => value || '')
