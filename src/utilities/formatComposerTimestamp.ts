/**
 * Medium date + short time (`en-US`) for page composer chrome.
 * Empty values show as `Not published`; invalid dates fall back to the raw string.
 */
export function formatComposerTimestamp(value: null | string | undefined): string {
  if (!value) return 'Not published'
  try {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  } catch {
    return value
  }
}
