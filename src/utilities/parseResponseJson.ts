/** Parse JSON from a `fetch` Response; returns `null` on empty body or parse failure. */
export async function parseResponseJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null
}
