function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

export function calculateServicePlanPricing(args: {
  billingInstallmentsPerYear?: null | number
  discountPercent?: null | number
  singleJobAmount?: null | number
  visitsPerYear?: null | number
}) {
  const singleJobAmount = Math.max(0, Number(args.singleJobAmount) || 0)
  const visitsPerYear = Math.max(1, Math.round(Number(args.visitsPerYear) || 2))
  const discountPercent = Math.min(100, Math.max(0, Number(args.discountPercent) || 20))
  const billingInstallmentsPerYear = Math.max(1, Math.round(Number(args.billingInstallmentsPerYear) || 12))

  const discountedVisitAmount = roundCurrency(singleJobAmount * (1 - discountPercent / 100))
  const annualPlanAmount = roundCurrency(discountedVisitAmount * visitsPerYear)
  const installmentAmount = roundCurrency(annualPlanAmount / billingInstallmentsPerYear)
  const cadenceMonths = Math.max(1, Math.round(12 / visitsPerYear))

  return {
    annualPlanAmount,
    billingInstallmentsPerYear,
    cadenceMonths,
    discountedVisitAmount,
    discountPercent,
    installmentAmount,
    singleJobAmount,
    visitsPerYear,
  }
}

export function buildSuggestedVisitDates(args: {
  anchorDate?: null | string
  count?: number
  visitsPerYear?: null | number
}): string[] {
  const visitsPerYear = Math.max(1, Math.round(Number(args.visitsPerYear) || 2))
  const count = Math.max(1, Math.round(Number(args.count) || visitsPerYear))
  const base = args.anchorDate ? new Date(args.anchorDate) : new Date()

  if (Number.isNaN(base.getTime())) {
    return []
  }

  const cadenceMonths = Math.max(1, Math.round(12 / visitsPerYear))
  const dates: string[] = []

  for (let index = 0; index < count; index += 1) {
    const next = new Date(base)
    next.setMonth(base.getMonth() + cadenceMonths * index)
    dates.push(next.toISOString())
  }

  return dates
}
