/**
 * True when `value` is a non-null object (`typeof` check). Arrays pass; use when narrowing Payload/API `unknown`.
 */
export function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}
