function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalize(entry))
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalize(entry)]),
    )
  }

  return value
}

function coerceLeaf(existing: unknown): unknown {
  if (
    isPlainObject(existing) &&
    'id' in existing &&
    (typeof existing.id === 'string' || typeof existing.id === 'number')
  ) {
    return existing.id
  }

  return existing
}

export function projectExistingForSeed(existing: unknown, template: unknown): unknown {
  if (template === undefined) {
    return undefined
  }

  if (Array.isArray(template)) {
    const existingArray = Array.isArray(existing) ? existing : []
    return template.map((entry, index) => projectExistingForSeed(existingArray[index], entry))
  }

  if (isPlainObject(template)) {
    const existingObject = isPlainObject(existing) ? existing : {}

    return Object.fromEntries(
      Object.keys(template).map((key) => [
        key,
        projectExistingForSeed(existingObject[key], template[key]),
      ]),
    )
  }

  return coerceLeaf(existing)
}

export function seedDataMatchesExisting(existing: unknown, template: unknown): boolean {
  return (
    JSON.stringify(normalize(projectExistingForSeed(existing, template))) ===
    JSON.stringify(normalize(template))
  )
}
