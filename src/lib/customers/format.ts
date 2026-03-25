export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(value || 0)
}

export function formatDate(value: null | string | undefined): string {
  if (!value) return 'Not set'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function sentenceCase(value: null | string | undefined): string {
  if (!value) return 'Not set'
  return value
    .split('_')
    .filter(Boolean)
    .map((part, index) =>
      index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part.toLowerCase(),
    )
    .join(' ')
}
