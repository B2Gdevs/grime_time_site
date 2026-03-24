import { EngageBayScheduleFormClient } from './EngageBayScheduleFormClient'

/**
 * Renders the EngageBay / EngageHub embedded form when `ENGAGEBAY_SCHEDULE_FORM_ID` is set.
 */
export function EngageBayScheduleForm() {
  const formId = process.env.ENGAGEBAY_SCHEDULE_FORM_ID?.trim()
  const trackingKey = process.env.ENGAGEBAY_JS_TRACKING_KEY?.trim()
  const formRef = process.env.ENGAGEBAY_JS_FORM_REF?.trim()
  const hasAccountConfig = Boolean(formRef || trackingKey?.includes('|'))

  if (!formId) return null

  return <EngageBayScheduleFormClient formId={formId} hasAccountConfig={hasAccountConfig} />
}
