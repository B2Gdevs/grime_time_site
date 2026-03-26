export function relationId(
  value: null | number | string | { id?: null | number | string } | undefined,
): null | number | string {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' || typeof value === 'string') return value

  if ('id' in value && (typeof value.id === 'number' || typeof value.id === 'string')) {
    return value.id
  }

  return null
}

export function numericRelationId(
  value: null | number | string | { id?: null | number | string } | undefined,
): null | number {
  const id = relationId(value)
  return typeof id === 'number' ? id : null
}
