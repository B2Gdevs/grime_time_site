import { NextResponse } from 'next/server'
import { createLocalReq, getPayload, type File as PayloadFile } from 'payload'

import config from '@payload-config'
import { CONTACT_REQUEST_FORM_TITLE } from '@/lib/forms/contactRequest'
import { createLeadFormSubmission } from '@/lib/forms/createLeadFormSubmission'
import {
  validateInstantQuoteAttachmentBatch,
  type InstantQuoteAttachmentCandidate,
} from '@/lib/forms/instantQuoteAttachments'
import {
  instantQuoteRequestSchema,
  instantQuoteRequestToSubmissionRows,
  INSTANT_QUOTE_REQUEST_FORM_TITLE,
} from '@/lib/forms/instantQuoteRequest'
import {
  createRequestTrace,
  logRequestFailure,
  logRequestStart,
  logRequestSuccess,
  summarizeInstantQuoteRequest,
  withRequestIdHeader,
} from '@/lib/observability'
import { getInstantQuoteCatalog } from '@/lib/quotes/getInstantQuoteCatalog'

type ParsedInstantQuoteSubmission =
  | {
      attachments: File[]
      raw: unknown
    }
  | {
      error: string
    }

async function toPayloadFile(upload: File): Promise<PayloadFile> {
  const buffer = Buffer.from(await upload.arrayBuffer())

  return {
    data: buffer,
    mimetype: upload.type || 'application/octet-stream',
    name: upload.name,
    size: buffer.byteLength,
  }
}

function parseAttachmentCandidate(file: File): InstantQuoteAttachmentCandidate {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
  }
}

function parseAttachments(formData: FormData) {
  return formData
    .getAll('attachments')
    .filter((value): value is File => value instanceof File && value.size > 0)
}

async function parseInstantQuoteSubmission(request: Request): Promise<ParsedInstantQuoteSubmission> {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const rawPayload = String(formData.get('payload') || '').trim()

    if (!rawPayload) {
      return { error: 'Missing instant-quote payload.' }
    }

    try {
      return {
        attachments: parseAttachments(formData),
        raw: JSON.parse(rawPayload),
      }
    } catch {
      return { error: 'Could not read the estimate request payload.' }
    }
  }

  return {
    attachments: [],
    raw: await request.json().catch(() => null),
  }
}

export async function POST(request: Request) {
  const trace = createRequestTrace(request, 'lead-forms.instant-quote')
  logRequestStart(trace)
  const parsed = await parseInstantQuoteSubmission(request)

  if ('error' in parsed) {
    logRequestFailure(trace, 400, undefined, {
      reason: 'invalid_payload_transport',
    })

    return withRequestIdHeader(
      NextResponse.json(
        {
          error: parsed.error,
        },
        { status: 400 },
      ),
      trace.requestId,
    )
  }

  const attachmentIssues = validateInstantQuoteAttachmentBatch(
    parsed.attachments.map(parseAttachmentCandidate),
  )

  if (attachmentIssues.length > 0) {
    logRequestFailure(trace, 400, undefined, {
      attachmentCount: parsed.attachments.length,
      issueCount: attachmentIssues.length,
      reason: 'attachment_validation_failed',
    })

    return withRequestIdHeader(
      NextResponse.json(
        {
          error: attachmentIssues[0] || 'Could not validate the uploaded images.',
          issues: attachmentIssues,
        },
        { status: 400 },
      ),
      trace.requestId,
    )
  }

  const result = instantQuoteRequestSchema.safeParse(parsed.raw)

  if (!result.success) {
    logRequestFailure(trace, 400, undefined, {
      attachmentCount: parsed.attachments.length,
      issueCount: result.error.issues.length,
      reason: 'validation_failed',
    })

    return withRequestIdHeader(
      NextResponse.json(
        {
          error: result.error.issues[0]?.message || 'Could not validate the estimate request.',
          issues: result.error.flatten(),
        },
        { status: 400 },
      ),
      trace.requestId,
    )
  }

  const payload = await getPayload({ config })
  const summary = {
    ...summarizeInstantQuoteRequest(result.data),
    attachmentCount: parsed.attachments.length,
  }

  try {
    const catalog = await getInstantQuoteCatalog({ payload })
    const submission = await createLeadFormSubmission({
      candidateTitles: [INSTANT_QUOTE_REQUEST_FORM_TITLE, CONTACT_REQUEST_FORM_TITLE],
      payload,
      submissionData: instantQuoteRequestToSubmissionRows(result.data, catalog),
    })
    const payloadReq = await createLocalReq({}, payload)
    let attachmentSyncStatus: 'failed' | 'saved' = 'saved'

    if (parsed.attachments.length > 0) {
      try {
        await Promise.all(
          parsed.attachments.map(async (attachment) =>
            payload.create({
              collection: 'instant-quote-request-attachments',
              data: {
                attachmentStatus: 'new',
                contentType: attachment.type || 'application/octet-stream',
                customerFilename: attachment.name,
                fileSizeBytes: attachment.size,
                intakeSource: 'instant_quote',
                submission: submission.id,
              },
              depth: 0,
              file: await toPayloadFile(attachment),
              overrideAccess: true,
              req: payloadReq,
            }),
          ),
        )
      } catch (attachmentError) {
        attachmentSyncStatus = 'failed'
        payload.logger.error(
          { attachmentCount: parsed.attachments.length, err: attachmentError, submissionId: submission.id },
          'Instant quote attachments failed to persist after submission create',
        )
      }
    }

    const scheduling = Boolean(result.data.requestScheduling)
    const savedAttachmentCount = attachmentSyncStatus === 'saved' ? parsed.attachments.length : 0
    const attachmentMessage =
      savedAttachmentCount > 0
        ? ` We saved ${savedAttachmentCount} photo${savedAttachmentCount === 1 ? '' : 's'} for staff review.`
        : attachmentSyncStatus === 'failed'
          ? ' We saved the request, but the photo upload did not finish. Reply to our follow-up with photos if needed.'
          : ''

    logRequestSuccess(trace, 200, {
      ...summary,
      attachmentSyncStatus,
      crmSyncStatus: submission.crmSyncStatus ?? null,
      submissionId: submission.id,
    })

    return withRequestIdHeader(
      NextResponse.json({
        attachmentCount: savedAttachmentCount,
        attachmentSyncStatus,
        crmSyncStatus: submission.crmSyncStatus ?? null,
        message: scheduling
          ? `Request sent. We saved your estimate and scheduling details and will follow up to confirm scope and timing.${attachmentMessage}`
          : `Estimate request sent. We saved your details and will follow up with a scoped quote.${attachmentMessage}`,
        ok: true,
        submissionId: submission.id,
      }),
      trace.requestId,
    )
  } catch (error) {
    payload.logger.error({ err: error, requestId: trace.requestId }, 'Instant quote request submission failed')
    logRequestFailure(trace, 500, error, summary)

    return withRequestIdHeader(
      NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Could not submit the estimate request right now.',
        },
        { status: 500 },
      ),
      trace.requestId,
    )
  }
}
