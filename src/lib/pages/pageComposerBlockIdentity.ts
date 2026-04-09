export function createPageLayoutBlockUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `block-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

export function assignPageLayoutBlockUuid<T extends object>(block: T): T & { _uuid: string } {
  const candidate = block as { _uuid?: unknown }

  if (typeof candidate._uuid === 'string' && candidate._uuid.trim()) {
    return block as T & { _uuid: string }
  }

  return {
    ...block,
    _uuid: createPageLayoutBlockUuid(),
  }
}
