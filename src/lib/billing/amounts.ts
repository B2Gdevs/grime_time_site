export function fromMinorUnits(value: null | number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }

  return value / 100
}

export function toMinorUnits(value: null | number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }

  return Math.round(value * 100)
}

export function timestampToIso(value: null | number | undefined): null | string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return new Date(value * 1000).toISOString()
}
