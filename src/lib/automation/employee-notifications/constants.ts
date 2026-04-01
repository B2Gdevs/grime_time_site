export const EMPLOYEE_NOTIFICATION_TYPES = [
  'lead_created',
  'lead_owner_reassigned',
] as const

export type EmployeeNotificationType = (typeof EMPLOYEE_NOTIFICATION_TYPES)[number]
