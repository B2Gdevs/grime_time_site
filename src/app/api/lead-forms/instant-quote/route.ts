import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { CONTACT_REQUEST_FORM_TITLE } from '@/lib/forms/contactRequest'
import { createLeadFormSubmission } from '@/lib/forms/createLeadFormSubmission'
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

export async function POST(request: Request) {
  const trace = createRequestTrace(request, 'lead-forms.instant-quote')
  logRequestStart(trace)
  const raw = await request.json().catch(() => null)
  const result = instantQuoteRequestSchema.safeParse(raw)

  if (!result.success) {
    logRequestFailure(trace, 400, undefined, {
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
  const summary = summarizeInstantQuoteRequest(result.data)

  try {
    const catalog = await getInstantQuoteCatalog({ payload })
    const submission = await createLeadFormSubmission({
      candidateTitles: [INSTANT_QUOTE_REQUEST_FORM_TITLE, CONTACT_REQUEST_FORM_TITLE],
      payload,
      submissionData: instantQuoteRequestToSubmissionRows(result.data, catalog),
    })

    const scheduling = Boolean(result.data.requestScheduling)

    logRequestSuccess(trace, 200, {
      ...summary,
      crmSyncStatus: submission.crmSyncStatus ?? null,
      submissionId: submission.id,
    })

    return withRequestIdHeader(
      NextResponse.json({
        crmSyncStatus: submission.crmSyncStatus ?? null,
        message: scheduling
          ? 'Request sent. We saved your estimate and scheduling details and will follow up to confirm scope and timing.'
          : 'Estimate request sent. We saved your details and will follow up with a scoped quote.',
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
