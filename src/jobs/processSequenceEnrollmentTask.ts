import type { TaskConfig } from 'payload'

import { processSequenceEnrollmentStep } from '@/lib/automation/sequences/process'

export const processSequenceEnrollmentTask: TaskConfig = {
  slug: 'processSequenceEnrollmentStep',
  label: 'Process CRM sequence enrollment step',
  inputSchema: [
    {
      name: 'enrollmentId',
      type: 'text',
      required: true,
    },
  ],
  handler: async ({ input, req }) => {
    const parsed = (input ?? {}) as { enrollmentId: string }
    await processSequenceEnrollmentStep(req.payload, parsed.enrollmentId)

    return {
      output: {
        processed: true,
      },
    }
  },
  outputSchema: [
    {
      name: 'processed',
      type: 'checkbox',
      required: true,
    },
  ],
  retries: 1,
}
