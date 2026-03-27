export function readErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    if ('error' in payload && typeof payload.error === 'string') return payload.error
    if ('message' in payload && typeof payload.message === 'string') return payload.message
    if (
      'errors' in payload &&
      Array.isArray(payload.errors) &&
      payload.errors[0] &&
      typeof payload.errors[0] === 'object' &&
      payload.errors[0] &&
      'message' in payload.errors[0] &&
      typeof payload.errors[0].message === 'string'
    ) {
      return payload.errors[0].message
    }
  }

  return fallback
}
