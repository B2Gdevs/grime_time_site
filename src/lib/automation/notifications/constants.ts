export const CUSTOMER_NOTIFICATION_TYPES = [
  'lead_acknowledgement',
  'quote_sent',
  'invoice_issued',
  'invoice_overdue',
  'appointment_update',
] as const

export type CustomerNotificationType = (typeof CUSTOMER_NOTIFICATION_TYPES)[number]
