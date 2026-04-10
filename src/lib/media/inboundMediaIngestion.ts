export const INBOUND_MEDIA_INGESTION_MAX_ATTACHMENTS = 10
export const INBOUND_MEDIA_INGESTION_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
export const INBOUND_MEDIA_INGESTION_ACCEPTED_MIME_PREFIXES = ['image/', 'video/'] as const

export const inboundMediaIngestionStatusOptions = [
  { label: 'Received', value: 'received' },
  { label: 'Processing', value: 'processing' },
  { label: 'Ingested', value: 'ingested' },
  { label: 'Partial', value: 'partial' },
  { label: 'Failed validation', value: 'failed_validation' },
  { label: 'Failed processing', value: 'failed_processing' },
  { label: 'Replay requested', value: 'replay_requested' },
  { label: 'Replayed', value: 'replayed' },
] as const

export const inboundMediaIngestionProviderOptions = [
  { label: 'Resend inbound', value: 'resend' },
  { label: 'Manual import', value: 'manual' },
  { label: 'Other provider', value: 'other' },
] as const

export type InboundMediaIngestionStatus = (typeof inboundMediaIngestionStatusOptions)[number]['value']
export type InboundMediaIngestionProvider = (typeof inboundMediaIngestionProviderOptions)[number]['value']

export type InboundMediaAttachmentCandidate = {
  contentType: string
  filename: string
  providerAttachmentID?: null | string
  sizeBytes: number
}

function normalizeText(value: null | string | undefined): null | string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function normalizeInboundMediaEmailAddress(value: null | string | undefined): null | string {
  return normalizeText(value)?.toLowerCase() ?? null
}

export function buildInboundMediaIngestionIdempotencyKey(args: {
  provider: InboundMediaIngestionProvider
  providerEventID?: null | string
  providerMessageID?: null | string
  receivedAt?: null | string
  recipientEmail?: null | string
  senderEmail?: null | string
}) {
  const providerEventID = normalizeText(args.providerEventID)

  if (providerEventID) {
    return `${args.provider}:event:${providerEventID}`
  }

  const providerMessageID = normalizeText(args.providerMessageID)

  if (providerMessageID) {
    return `${args.provider}:message:${providerMessageID}`
  }

  const senderEmail = normalizeInboundMediaEmailAddress(args.senderEmail) ?? 'unknown-sender'
  const recipientEmail = normalizeInboundMediaEmailAddress(args.recipientEmail) ?? 'unknown-recipient'
  const receivedAt = normalizeText(args.receivedAt) ?? 'unknown-received-at'

  return `${args.provider}:fallback:${senderEmail}:${recipientEmail}:${receivedAt}`
}

export function buildInboundMediaIngestionLabel(args: {
  provider: InboundMediaIngestionProvider
  senderEmail?: null | string
  subject?: null | string
}) {
  const senderEmail = normalizeInboundMediaEmailAddress(args.senderEmail)
  const subject = normalizeText(args.subject)
  const providerLabel =
    args.provider === 'resend'
      ? 'Resend inbound media'
      : args.provider === 'manual'
        ? 'Manual inbound media import'
        : 'Inbound media import'

  if (senderEmail && subject) {
    return `${providerLabel} from ${senderEmail}: ${subject}`
  }

  if (senderEmail) {
    return `${providerLabel} from ${senderEmail}`
  }

  if (subject) {
    return `${providerLabel}: ${subject}`
  }

  return providerLabel
}

export function validateInboundMediaAttachmentBatch(
  files: InboundMediaAttachmentCandidate[],
): string[] {
  const issues: string[] = []

  if (files.length > INBOUND_MEDIA_INGESTION_MAX_ATTACHMENTS) {
    issues.push(`Accept up to ${INBOUND_MEDIA_INGESTION_MAX_ATTACHMENTS} attachments per inbound delivery.`)
  }

  for (const file of files) {
    if (
      !INBOUND_MEDIA_INGESTION_ACCEPTED_MIME_PREFIXES.some((prefix) =>
        file.contentType.startsWith(prefix),
      )
    ) {
      issues.push(`${file.filename} must be an image or video file.`)
    }

    if (file.sizeBytes > INBOUND_MEDIA_INGESTION_MAX_FILE_SIZE_BYTES) {
      issues.push(
        `${file.filename} exceeds the ${Math.round(INBOUND_MEDIA_INGESTION_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB limit.`,
      )
    }
  }

  return issues
}

export function buildInboundMediaAttachmentAudit(args: {
  attachments: InboundMediaAttachmentCandidate[]
}) {
  return args.attachments.map((attachment) => {
    const issues: string[] = []

    if (
      !INBOUND_MEDIA_INGESTION_ACCEPTED_MIME_PREFIXES.some((prefix) =>
        attachment.contentType.startsWith(prefix),
      )
    ) {
      issues.push('Unsupported attachment type.')
    }

    if (attachment.sizeBytes > INBOUND_MEDIA_INGESTION_MAX_FILE_SIZE_BYTES) {
      issues.push('Attachment exceeds the configured size limit.')
    }

    return {
      accepted: issues.length === 0,
      contentType: attachment.contentType,
      filename: attachment.filename,
      issues,
      providerAttachmentID: normalizeText(attachment.providerAttachmentID),
      sizeBytes: attachment.sizeBytes,
    }
  })
}

