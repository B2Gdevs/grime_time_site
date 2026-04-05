export const INSTANT_QUOTE_ATTACHMENT_MAX_FILES = 5
export const INSTANT_QUOTE_ATTACHMENT_MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024
export const INSTANT_QUOTE_ATTACHMENT_ACCEPTED_MIME_PREFIXES = ['image/'] as const

export type InstantQuoteAttachmentCandidate = {
  name: string
  size: number
  type: string
}

export function validateInstantQuoteAttachmentBatch(
  files: InstantQuoteAttachmentCandidate[],
): string[] {
  const issues: string[] = []

  if (files.length > INSTANT_QUOTE_ATTACHMENT_MAX_FILES) {
    issues.push(`Upload up to ${INSTANT_QUOTE_ATTACHMENT_MAX_FILES} images per request.`)
  }

  for (const file of files) {
    if (!INSTANT_QUOTE_ATTACHMENT_ACCEPTED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))) {
      issues.push(`${file.name} must be an image file.`)
    }

    if (file.size > INSTANT_QUOTE_ATTACHMENT_MAX_FILE_SIZE_BYTES) {
      issues.push(`${file.name} exceeds the ${Math.round(INSTANT_QUOTE_ATTACHMENT_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB limit.`)
    }
  }

  return issues
}
