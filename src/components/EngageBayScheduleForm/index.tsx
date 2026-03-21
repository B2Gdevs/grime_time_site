import { EngageBayScheduleFormClient } from './EngageBayScheduleFormClient'

/**
 * Renders the EngageBay / EngageHub embedded form when `ENGAGEBAY_SCHEDULE_FORM_ID` is set.
 */
export function EngageBayScheduleForm() {
  const formId = process.env.ENGAGEBAY_SCHEDULE_FORM_ID?.trim()
  if (!formId) return null
  return <EngageBayScheduleFormClient formId={formId} />
}
