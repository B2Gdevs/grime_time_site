import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { CONTACT_REQUEST_FORM_TITLE, contactRequestSchema, contactRequestToSubmissionRows } from '@/lib/forms/contactRequest'
import { createLeadFormSubmission } from '@/lib/forms/createLeadFormSubmission'
import {
  createRequestTrace,
  logRequestFailure,
  logRequestStart,
  logRequestSuccess,
  summarizeContactRequest,
  withRequestIdHeader,
} from '@/lib/observability'

export async function POST(request: Request) {
  const trace = createRequestTrace(request, 'lead-forms.contact')
  logRequestStart(trace)
  const raw = await request.json().catch(() => null)
  const result = contactRequestSchema.safeParse(raw)

  if (!result.success) {
    logRequestFailure(trace, 400, undefined, {
      issueCount: result.error.issues.length,
      reason: 'validation_failed',
    })

    return withRequestIdHeader(
      NextResponse.json(
        {
          error: result.error.issues[0]?.message || 'Could not validate the contact request.',
          issues: result.error.flatten(),
        },
        { status: 400 },
      ),
      trace.requestId,
    )
  }

  const payload = await getPayload({ config })
  const summary = summarizeContactRequest(result.data)

  try {
    const submission = await createLeadFormSubmission({
      candidateTitles: [CONTACT_REQUEST_FORM_TITLE],
      payload,
      submissionData: contactRequestToSubmissionRows(result.data),
    })

    logRequestSuccess(trace, 200, {
      ...summary,
      crmSyncStatus: submission.crmSyncStatus ?? null,
      submissionId: submission.id,
    })

    return withRequestIdHeader(
      NextResponse.json({
        crmSyncStatus: submission.crmSyncStatus ?? null,
        message: 'Message received. We saved it and pushed it into the follow-up queue.',
        ok: true,
        submissionId: submission.id,
      }),
      trace.requestId,
    )
  } catch (error) {
    payload.logger.error({ err: error, requestId: trace.requestId }, 'Contact request submission failed')
    logRequestFailure(trace, 500, error, summary)

    return withRequestIdHeader(
      NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Could not submit the contact request right now.',
        },
        { status: 500 },
      ),
      trace.requestId,
    )
  }
}
