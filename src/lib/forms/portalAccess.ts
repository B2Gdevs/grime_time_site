import { z } from 'zod'

export const claimAccountRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
})

export const completeClaimAccountSchema = z.object({
  token: z.string().trim().min(1, 'Missing claim token.'),
})

export const companyInviteSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid teammate email.'),
  name: z.string().trim().max(120).optional().or(z.literal('')),
})

export type ClaimAccountRequestValues = z.infer<typeof claimAccountRequestSchema>
export type CompleteClaimAccountValues = z.infer<typeof completeClaimAccountSchema>
export type CompanyInviteValues = z.infer<typeof companyInviteSchema>
