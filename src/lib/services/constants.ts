export const billingDocumentStatusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Open', value: 'open' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Void', value: 'void' },
] as const

export const servicePlanStatusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

export const serviceAppointmentStatusOptions = [
  { label: 'Requested', value: 'requested' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Reschedule requested', value: 'reschedule_requested' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

export const arrivalWindowOptions = [
  { label: 'Morning preferred', value: 'morning' },
  { label: 'Afternoon preferred', value: 'afternoon' },
  { label: 'Flexible', value: 'flexible' },
] as const
