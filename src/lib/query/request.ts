export async function parseJsonOrNull<T>(response: Response): Promise<null | T> {
  return (await response.json().catch(() => null)) as null | T
}

export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'include',
    ...init,
  })
  const body = await parseJsonOrNull<{ error?: string } & T>(response)

  if (!response.ok) {
    throw new Error(body?.error || 'Request failed.')
  }

  return body as T
}
