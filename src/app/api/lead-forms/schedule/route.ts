import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { SEED_CONTACT_FORM_TITLE } from '@/endpoints/seed/contact-form'
import { createLeadFormSubmission } from '@/lib/forms/createLeadFormSubmission'
import {
  scheduleRequestSchema,
  scheduleRequestToSubmissionRows,
  SCHEDULE_REQUEST_FORM_TITLE,
} from '@/lib/forms/scheduleRequest'
import {
  createRequestTrace,
  logRequestFailure,
  logRequestStart,
  logRequestSuccess,
  summarizeScheduleRequest,
  withRequestIdHeader,
} from '@/lib/observability'

export async function POST(request: Request) {
  const trace = createRequestTrace(request, 'lead-forms.schedule')
  logRequestStart(trace)
  const raw = await request.json().catch(() => null)
  const result = scheduleRequestSchema.safeParse(raw)

  if (!result.success) {
    logRequestFailure(trace, 400, undefined, {
      issueCount: result.error.issues.length,
      reason: 'validation_failed',
    })

    return withRequestIdHeader(
      NextResponse.json(
        {
          error: result.error.issues[0]?.message || 'Could not validate the scheduling request.',
          issues: result.error.flatten(),
        },
        { status: 400 },
      ),
      trace.requestId,
    )
  }

  const payload = await getPayload({ config })
  const summary = summarizeScheduleRequest(result.data)

  try {
    const submission = await createLeadFormSubmission({
      candidateTitles: [SCHEDULE_REQUEST_FORM_TITLE, SEED_CONTACT_FORM_TITLE],
      payload,
      submissionData: scheduleRequestToSubmissionRows(result.data),
    })

    logRequestSuccess(trace, 200, {
      ...summary,
      crmSyncStatus: submission.crmSyncStatus ?? null,
      submissionId: submission.id,
    })

    return withRequestIdHeader(
      NextResponse.json({
        crmSyncStatus: submission.crmSyncStatus ?? null,
        ok: true,
        submissionId: submission.id,
        message: 'Request received. We saved it and pushed it into the team follow-up flow.',
      }),
      trace.requestId,
    )
  } catch (error) {
    payload.logger.error({ err: error, requestId: trace.requestId }, 'Schedule request submission failed')
    logRequestFailure(trace, 500, error, summary)

    return withRequestIdHeader(
      NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Could not submit the scheduling request right now.',
        },
        { status: 500 },
      ),
      trace.requestId,
    )
  }
}
