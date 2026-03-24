export function readApiErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    if ('error' in payload && typeof payload.error === 'string') return payload.error
    if ('message' in payload && typeof payload.message === 'string') return payload.message
    if (
      'errors' in payload &&
      Array.isArray(payload.errors) &&
      payload.errors[0] &&
      typeof payload.errors[0] === 'object' &&
      'message' in payload.errors[0] &&
      typeof payload.errors[0].message === 'string'
    ) {
      return payload.errors[0].message
    }
  }

  return fallback
}

export async function postJsonForm<TRequest extends object, TResponse = unknown>(
  url: string,
  data: TRequest,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(readApiErrorMessage(payload, 'Could not submit the form.'))
  }

  return payload as TResponse
}
