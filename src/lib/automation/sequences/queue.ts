import type { Payload, PayloadRequest } from 'payload'

export async function queueSequenceEnrollmentStep(args: {
  enrollmentId: number | string
  payload: Payload
  queue?: string
  req?: PayloadRequest
  waitUntil?: Date
}) {
  await args.payload.jobs.queue({
    input: {
      enrollmentId: String(args.enrollmentId),
    },
    overrideAccess: true,
    queue: args.queue ?? 'crm-automation',
    req: args.req,
    task: 'processSequenceEnrollmentStep',
    waitUntil: args.waitUntil,
  })
}
