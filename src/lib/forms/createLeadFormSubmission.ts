import type { Payload } from 'payload'

import type { FormSubmission } from '@/payload-types'

type SubmissionRow = {
  field: string
  value: string
}

export async function resolveLeadFormId(
  payload: Payload,
  candidateTitles: string[],
): Promise<number | null> {
  const forms = await payload.find({
    collection: 'forms',
    depth: 0,
    limit: candidateTitles.length,
    overrideAccess: true,
    pagination: false,
    sort: 'title',
    where: {
      title: {
        in: candidateTitles,
      },
    },
  })

  for (const title of candidateTitles) {
    const hit = forms.docs.find((doc) => doc.title === title)
    if (typeof hit?.id === 'number') return hit.id
  }

  return null
}

export async function createLeadFormSubmission(args: {
  candidateTitles: string[]
  payload: Payload
  submissionData: SubmissionRow[]
}): Promise<FormSubmission> {
  const formId = await resolveLeadFormId(args.payload, args.candidateTitles)

  if (!formId) {
    throw new Error('No lead form is configured in Payload yet. Seed the forms or create one in admin.')
  }

  return args.payload.create({
    collection: 'form-submissions',
    data: {
      form: formId,
      submissionData: args.submissionData,
    },
  })
}
