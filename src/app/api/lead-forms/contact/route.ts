import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { CONTACT_REQUEST_FORM_TITLE, contactRequestSchema, contactRequestToSubmissionRows } from '@/lib/forms/contactRequest'
import { createLeadFormSubmission } from '@/lib/forms/createLeadFormSubmission'

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const raw = await request.json().catch(() => null)
  const result = contactRequestSchema.safeParse(raw)

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error.issues[0]?.message || 'Could not validate the contact request.',
        issues: result.error.flatten(),
      },
      { status: 400 },
    )
  }

  try {
    const submission = await createLeadFormSubmission({
      candidateTitles: [CONTACT_REQUEST_FORM_TITLE],
      payload,
      submissionData: contactRequestToSubmissionRows(result.data),
    })

    return NextResponse.json({
      crmSyncStatus: submission.crmSyncStatus ?? null,
      message: 'Message received. We saved it and pushed it into the follow-up queue.',
      ok: true,
      submissionId: submission.id,
    })
  } catch (error) {
    payload.logger.error({ err: error }, 'Contact request submission failed')

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Could not submit the contact request right now.',
      },
      { status: 500 },
    )
  }
}
