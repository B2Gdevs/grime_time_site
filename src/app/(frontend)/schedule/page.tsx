import type { Metadata } from 'next'

import { EngageBayScheduleForm } from '@/components/EngageBayScheduleForm'

export const metadata: Metadata = {
  title: 'Schedule',
  description: 'Book a service or consultation with Grime Time.',
}

export default function SchedulePage() {
  const formConfigured = Boolean(process.env.ENGAGEBAY_SCHEDULE_FORM_ID?.trim())

  return (
    <div className="container pt-24 pb-24">
      <div className="prose dark:prose-invert mb-10 max-w-none">
        <h1>Schedule</h1>
        <p>Pick a time using the form below.</p>
      </div>
      {formConfigured ? (
        <EngageBayScheduleForm />
      ) : (
        <p className="text-muted-foreground">
          Add <code className="text-sm">ENGAGEBAY_SCHEDULE_FORM_ID</code> to your environment to show the
          booking form.
        </p>
      )}
    </div>
  )
}
