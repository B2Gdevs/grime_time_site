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

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const raw = await request.json().catch(() => null)
  const result = scheduleRequestSchema.safeParse(raw)

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error.issues[0]?.message || 'Could not validate the scheduling request.',
        issues: result.error.flatten(),
      },
      { status: 400 },
    )
  }

  try {
    const submission = await createLeadFormSubmission({
      candidateTitles: [SCHEDULE_REQUEST_FORM_TITLE, SEED_CONTACT_FORM_TITLE],
      payload,
      submissionData: scheduleRequestToSubmissionRows(result.data),
    })

    return NextResponse.json({
      crmSyncStatus: submission.crmSyncStatus ?? null,
      ok: true,
      submissionId: submission.id,
      message: 'Request received. We saved it and pushed it into the team follow-up flow.',
    })
  } catch (error) {
    payload.logger.error({ err: error }, 'Schedule request submission failed')

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not submit the scheduling request right now.',
      },
      { status: 500 },
    )
  }
}
