import { createLocalReq, type File as PayloadFile, type Payload } from 'payload'
import type { AttachmentData, Resend, WebhookEventPayload } from 'resend'

import {
  buildInboundMediaAttachmentAudit,
  buildInboundMediaIngestionIdempotencyKey,
  buildInboundMediaIngestionLabel,
  normalizeInboundMediaEmailAddress,
  validateInboundMediaAttachmentBatch,
  INBOUND_MEDIA_INGESTION_MAX_ATTACHMENTS,
} from '@/lib/media/inboundMediaIngestion'

type InboundMediaIngestionRecord = {
  id: number | string
  notes?: null | string
  replayCount?: null | number
  status?: null | string
}

type AttachmentAuditRow = {
  accepted: boolean
  contentType: string
  filename: string
  issues: string[]
  linkedMediaID?: null | number | string
  providerAttachmentID?: null | string
  sizeBytes: number
}

export type ResendInboundMediaResult = {
  createdMediaCount: number
  duplicate: boolean
  handled: boolean
  ingestionId: null | string
  status: null | string
}

function normalizeText(value: null | string | undefined): null | string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function parseMailbox(value: null | string | undefined) {
  const normalized = normalizeText(value)

  if (!normalized) {
    return {
      email: null,
      name: null,
    }
  }

  const match = normalized.match(/^(?<name>.*?)<(?<email>[^>]+)>$/)
  const email = normalizeInboundMediaEmailAddress(match?.groups?.email ?? normalized)
  const name = normalizeText(match?.groups?.name?.replace(/^["']|["']$/g, '') ?? null)

  return {
    email,
    name,
  }
}

function toPayloadFile(args: {
  contentType: string
  data: Buffer
  filename: string
}): PayloadFile {
  return {
    data: args.data,
    mimetype: args.contentType || 'application/octet-stream',
    name: args.filename,
    size: args.data.byteLength,
  }
}

function buildMediaAltText(args: {
  filename: string
  senderEmail?: null | string
  subject?: null | string
}) {
  const subject = normalizeText(args.subject)

  if (subject) {
    return subject
  }

  const senderEmail = normalizeInboundMediaEmailAddress(args.senderEmail)

  if (senderEmail) {
    return `Inbound media from ${senderEmail}`
  }

  return args.filename
}

async function findIngestionByIdempotencyKey(args: {
  idempotencyKey: string
  payload: Payload
  req: Awaited<ReturnType<typeof createLocalReq>>
}) {
  const result = await args.payload.find({
    collection: 'inbound-media-ingestions',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req: args.req,
    where: {
      idempotencyKey: {
        equals: args.idempotencyKey,
      },
    },
  })

  return (result.docs[0] ?? null) as InboundMediaIngestionRecord | null
}

async function listReceivingAttachments(args: {
  emailId: string
  resend: Resend
}) {
  const response = await args.resend.emails.receiving.attachments.list({
    emailId: args.emailId,
  })

  if (response.error || !response.data) {
    throw new Error(response.error?.message || 'Could not load inbound attachments from Resend.')
  }

  return response.data.data
}

async function downloadAttachment(attachment: AttachmentData) {
  const response = await fetch(attachment.download_url)

  if (!response.ok) {
    throw new Error(`Could not download ${attachment.filename || attachment.id} from Resend.`)
  }

  return Buffer.from(await response.arrayBuffer())
}

function mergeNotes(existing: null | string | undefined, next: null | string | undefined) {
  const segments = [normalizeText(existing), normalizeText(next)].filter(Boolean)
  return segments.length > 0 ? segments.join('\n\n') : undefined
}

export async function handleResendInboundEmailEvent(args: {
  event: WebhookEventPayload
  payload: Payload
  providerEventID?: null | string
  resend: Resend
}): Promise<ResendInboundMediaResult> {
  if (args.event.type !== 'email.received') {
    return {
      createdMediaCount: 0,
      duplicate: false,
      handled: false,
      ingestionId: null,
      status: null,
    }
  }

  const payloadReq = await createLocalReq({}, args.payload)
  const sender = parseMailbox(args.event.data.from)
  const recipientEmail = normalizeInboundMediaEmailAddress(args.event.data.to[0] ?? null)
  const subject = normalizeText(args.event.data.subject)
  const payloadSnapshot = JSON.parse(JSON.stringify(args.event)) as Record<string, unknown>
  const idempotencyKey = buildInboundMediaIngestionIdempotencyKey({
    provider: 'resend',
    providerEventID: args.providerEventID,
    providerMessageID: args.event.data.message_id,
    receivedAt: args.event.data.created_at,
    recipientEmail,
    senderEmail: sender.email,
  })

  const existing = await findIngestionByIdempotencyKey({
    idempotencyKey,
    payload: args.payload,
    req: payloadReq,
  })

  if (existing && existing.status !== 'replay_requested') {
    return {
      createdMediaCount: 0,
      duplicate: true,
      handled: true,
      ingestionId: String(existing.id),
      status: existing.status ?? null,
    }
  }

  const baseData = {
    idempotencyKey,
    ingestionLabel: buildInboundMediaIngestionLabel({
      provider: 'resend',
      senderEmail: sender.email,
      subject,
    }),
    payloadSnapshot,
    processedAt: undefined,
    provider: 'resend' as const,
    providerEventID: normalizeText(args.providerEventID) ?? undefined,
    providerMessageID: normalizeText(args.event.data.message_id) ?? undefined,
    replayCount: typeof existing?.replayCount === 'number' ? existing.replayCount : 0,
    receivedAt: args.event.data.created_at,
    recipientEmail: recipientEmail ?? undefined,
    senderEmail: sender.email ?? undefined,
    senderName: sender.name ?? undefined,
    status: 'processing' as const,
    subject: subject ?? undefined,
  }

  const ingestion = existing
    ? await args.payload.update({
        collection: 'inbound-media-ingestions',
        data: {
          ...baseData,
          notes: mergeNotes(existing.notes, 'Replay processing started from a replay-requested ingestion.'),
        },
        id: existing.id,
        overrideAccess: true,
        req: payloadReq,
      })
    : await args.payload.create({
        collection: 'inbound-media-ingestions',
        data: baseData,
        draft: false,
        depth: 0,
        overrideAccess: true,
        req: payloadReq,
      })

  const ingestionId = String(ingestion.id)

  try {
    const attachments = await listReceivingAttachments({
      emailId: args.event.data.email_id,
      resend: args.resend,
    })
    const attachmentAudit = buildInboundMediaAttachmentAudit({
      attachments: attachments.map((attachment) => ({
        contentType: attachment.content_type,
        filename: attachment.filename || attachment.id,
        providerAttachmentID: attachment.id,
        sizeBytes: attachment.size,
      })),
    }) as AttachmentAuditRow[]
    const validationIssues = validateInboundMediaAttachmentBatch(
      attachments.map((attachment) => ({
        contentType: attachment.content_type,
        filename: attachment.filename || attachment.id,
        providerAttachmentID: attachment.id,
        sizeBytes: attachment.size,
      })),
    )

    if (attachments.length > INBOUND_MEDIA_INGESTION_MAX_ATTACHMENTS) {
      await args.payload.update({
        collection: 'inbound-media-ingestions',
        data: {
          attachmentAudit,
          createdMediaIDs: [],
          latestError: validationIssues.join(' '),
          processedAt: new Date().toISOString(),
          status: 'failed_validation',
        },
        id: ingestion.id,
        overrideAccess: true,
        req: payloadReq,
      })

      return {
        createdMediaCount: 0,
        duplicate: false,
        handled: true,
        ingestionId,
        status: 'failed_validation',
      }
    }

    const createdMediaIDs: string[] = []
    const processingIssues: string[] = []

    for (const attachment of attachments) {
      const auditRow = attachmentAudit.find((row) => row.providerAttachmentID === attachment.id)

      if (!auditRow?.accepted) {
        continue
      }

      try {
        const fileBuffer = await downloadAttachment(attachment)
        const mediaDoc = await args.payload.create({
          collection: 'media',
          data: {
            alt: buildMediaAltText({
              filename: attachment.filename || attachment.id,
              senderEmail: sender.email,
              subject,
            }),
          },
          draft: false,
          depth: 0,
          file: toPayloadFile({
            contentType: attachment.content_type,
            data: fileBuffer,
            filename: attachment.filename || attachment.id,
          }),
          overrideAccess: true,
          req: payloadReq,
        })

        auditRow.linkedMediaID = mediaDoc.id
        createdMediaIDs.push(String(mediaDoc.id))
      } catch (error) {
        auditRow.accepted = false
        auditRow.issues = [
          ...auditRow.issues,
          error instanceof Error ? error.message : 'Attachment processing failed.',
        ]
        processingIssues.push(`${auditRow.filename}: ${auditRow.issues[auditRow.issues.length - 1]}`)
      }
    }

    const rejectedAttachmentCount = attachmentAudit.filter((row) => row.accepted === false).length
    const createdMediaCount = createdMediaIDs.length
    const finalStatus =
      createdMediaCount === 0
        ? 'failed_validation'
        : rejectedAttachmentCount > 0 || validationIssues.length > 0 || processingIssues.length > 0
          ? 'partial'
          : 'ingested'

    await args.payload.update({
      collection: 'inbound-media-ingestions',
      data: {
        attachmentAudit,
        createdMediaIDs,
        latestError:
          [...validationIssues, ...processingIssues].length > 0
            ? [...validationIssues, ...processingIssues].join(' ')
            : undefined,
        processedAt: new Date().toISOString(),
        status: finalStatus,
      },
      id: ingestion.id,
      overrideAccess: true,
      req: payloadReq,
    })

    return {
      createdMediaCount,
      duplicate: false,
      handled: true,
      ingestionId,
      status: finalStatus,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Inbound media ingestion failed during processing.'

    await args.payload.update({
      collection: 'inbound-media-ingestions',
      data: {
        latestError: message,
        processedAt: new Date().toISOString(),
        status: 'failed_processing',
      },
      id: ingestion.id,
      overrideAccess: true,
      req: payloadReq,
    })

    args.payload.logger.error(
      {
        err: error,
        eventType: args.event.type,
        ingestionId,
        providerEventID: args.providerEventID ?? null,
      },
      'Inbound Resend media processing failed',
    )

    return {
      createdMediaCount: 0,
      duplicate: false,
      handled: true,
      ingestionId,
      status: 'failed_processing',
    }
  }
}
