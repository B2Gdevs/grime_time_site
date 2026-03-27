import type { Account, User } from '@/payload-types'

export const billingDiscountTypeOptions = [
  { label: 'No default discount', value: 'none' },
  { label: 'Percent', value: 'percent' },
  { label: 'Flat amount', value: 'flat_amount' },
] as const

export type BillingDiscountType = (typeof billingDiscountTypeOptions)[number]['value']

type DiscountCarrier = {
  defaultDiscountNote?: null | string
  defaultDiscountType?: null | string
  defaultDiscountValue?: null | number
  name?: null | string
}

type UserDiscountCarrier = {
  billingDiscountNote?: null | string
  billingDiscountType?: null | string
  billingDiscountValue?: null | number
  email?: null | string
  name?: null | string
}

export type ActiveBillingDiscount = {
  amount: number
  label: string
  note: null | string
  source: 'account' | 'none' | 'user'
  type: BillingDiscountType
  value: number
}

function normalizeDiscountType(value: null | string | undefined): BillingDiscountType {
  if (value === 'percent' || value === 'flat_amount') return value
  return 'none'
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

function computeDiscountAmount(total: number, type: BillingDiscountType, value: number): number {
  const normalizedTotal = Math.max(0, Number(total) || 0)
  const normalizedValue = Math.max(0, Number(value) || 0)

  if (type === 'percent') {
    return roundCurrency(normalizedTotal * (Math.min(100, normalizedValue) / 100))
  }

  if (type === 'flat_amount') {
    return roundCurrency(Math.min(normalizedTotal, normalizedValue))
  }

  return 0
}

function buildLabel(type: BillingDiscountType, value: number): string {
  if (type === 'percent') return `${value}% default discount`
  if (type === 'flat_amount') return `$${roundCurrency(value).toFixed(2)} default discount`
  return 'No default discount'
}

function userDiscountCarrier(user: null | number | string | User | undefined): null | UserDiscountCarrier {
  if (!user || typeof user === 'number' || typeof user === 'string') {
    return null
  }

  return user
}

function accountDiscountCarrier(account: null | number | string | Account | undefined): null | DiscountCarrier {
  if (!account || typeof account === 'number' || typeof account === 'string') {
    return null
  }

  return account
}

export function resolveActiveBillingDiscount(args: {
  account?: null | number | string | Account
  total: number
  user?: null | number | string | User
}): ActiveBillingDiscount {
  const user = userDiscountCarrier(args.user)
  const account = accountDiscountCarrier(args.account)

  const userType = normalizeDiscountType(user?.billingDiscountType)
  const userValue = Math.max(0, Number(user?.billingDiscountValue) || 0)

  if (user && userType !== 'none' && userValue > 0) {
    return {
      amount: computeDiscountAmount(args.total, userType, userValue),
      label: `${buildLabel(userType, userValue)} (${user.name || user.email || 'user override'})`,
      note: user.billingDiscountNote ?? null,
      source: 'user',
      type: userType,
      value: userValue,
    }
  }

  const accountType = normalizeDiscountType(account?.defaultDiscountType)
  const accountValue = Math.max(0, Number(account?.defaultDiscountValue) || 0)

  if (account && accountType !== 'none' && accountValue > 0) {
    return {
      amount: computeDiscountAmount(args.total, accountType, accountValue),
      label: `${buildLabel(accountType, accountValue)} (${account.name || 'account default'})`,
      note: account.defaultDiscountNote ?? null,
      source: 'account',
      type: accountType,
      value: accountValue,
    }
  }

  return {
    amount: 0,
    label: 'No default discount',
    note: null,
    source: 'none',
    type: 'none',
    value: 0,
  }
}

