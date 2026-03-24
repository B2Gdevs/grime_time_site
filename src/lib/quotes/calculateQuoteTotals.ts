type QuoteLineInput = {
  quantity?: null | number
  taxable?: boolean | null
  unitPrice?: null | number
}

type QuotePricingInput = {
  discountAmount?: null | number
  serviceLines?: null | QuoteLineInput[]
  taxDecision?: null | string
  taxRatePercent?: null | number
}

type QuoteTotals = {
  salesTaxAmount: number
  subtotal: number
  taxableSubtotal: number
  total: number
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calculateLineTotal(line: QuoteLineInput): number {
  const quantity = Number(line.quantity ?? 0)
  const unitPrice = Number(line.unitPrice ?? 0)

  return roundCurrency(quantity * unitPrice)
}

function isTaxExplicitlyExempt(taxDecision: string | null | undefined): boolean {
  return taxDecision === 'homebuilder_exception' || taxDecision === 'exemption_certificate'
}

export function calculateQuoteTotals(input: QuotePricingInput): QuoteTotals {
  const serviceLines = Array.isArray(input.serviceLines) ? input.serviceLines : []
  const discountAmount = roundCurrency(Number(input.discountAmount ?? 0))
  const taxRatePercent = Number(input.taxRatePercent ?? 0)

  const subtotalBeforeDiscount = roundCurrency(
    serviceLines.reduce((sum, line) => sum + calculateLineTotal(line), 0),
  )

  const taxableBeforeDiscount = roundCurrency(
    serviceLines.reduce((sum, line) => {
      if (!line.taxable) return sum
      return sum + calculateLineTotal(line)
    }, 0),
  )

  const subtotal = roundCurrency(Math.max(0, subtotalBeforeDiscount - discountAmount))
  const taxableSubtotal = isTaxExplicitlyExempt(input.taxDecision)
    ? 0
    : roundCurrency(Math.max(0, taxableBeforeDiscount - discountAmount))
  const salesTaxAmount = roundCurrency(taxableSubtotal * (Math.max(0, taxRatePercent) / 100))
  const total = roundCurrency(subtotal + salesTaxAmount)

  return {
    salesTaxAmount,
    subtotal,
    taxableSubtotal,
    total,
  }
}
