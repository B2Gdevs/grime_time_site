export const CRM_PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
] as const

export const CRM_LEAD_STATUS_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Working', value: 'working' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Disqualified', value: 'disqualified' },
  { label: 'Converted', value: 'converted' },
] as const

export const CRM_LEAD_SOURCE_OPTIONS = [
  { label: 'Instant quote', value: 'instant_quote' },
  { label: 'Contact request', value: 'contact_request' },
  { label: 'Schedule request', value: 'schedule_request' },
  { label: 'Phone call', value: 'phone_call' },
  { label: 'Referral', value: 'referral' },
  { label: 'Repeat customer', value: 'repeat_customer' },
  { label: 'Manual', value: 'manual' },
] as const

export const CRM_TEMPERATURE_OPTIONS = [
  { label: 'Cold', value: 'cold' },
  { label: 'Warm', value: 'warm' },
  { label: 'Hot', value: 'hot' },
] as const

export const CRM_ACCOUNT_STATUS_OPTIONS = [
  { label: 'Prospect', value: 'prospect' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Archived', value: 'archived' },
] as const

export const CRM_ACCOUNT_TYPE_OPTIONS = [
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'HOA / multifamily', value: 'hoa_multifamily' },
  { label: 'Municipal', value: 'municipal' },
  { label: 'Other', value: 'other' },
] as const

export const CRM_ACCOUNT_BILLING_TERMS_OPTIONS = [
  { label: 'Due on receipt', value: 'due_on_receipt' },
  { label: 'Net 15', value: 'net_15' },
  { label: 'Net 30', value: 'net_30' },
  { label: 'Custom', value: 'custom' },
] as const

export const CRM_CONTACT_ROLE_OPTIONS = [
  { label: 'Primary', value: 'primary' },
  { label: 'Billing', value: 'billing' },
  { label: 'On-site', value: 'onsite' },
  { label: 'Decision maker', value: 'decision_maker' },
  { label: 'Other', value: 'other' },
] as const

export const CRM_CONTACT_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Unsubscribed', value: 'unsubscribed' },
  { label: 'Do not contact', value: 'do_not_contact' },
  { label: 'Inactive', value: 'inactive' },
] as const

export const CRM_PREFERRED_CONTACT_METHOD_OPTIONS = [
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'phone' },
  { label: 'Text', value: 'text' },
  { label: 'Any', value: 'any' },
] as const

export const CRM_OPPORTUNITY_STATUS_OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
] as const

export const CRM_OPPORTUNITY_STAGE_OPTIONS = [
  { label: 'New lead', value: 'new_lead' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Quoted', value: 'quoted' },
  { label: 'Follow-up', value: 'follow_up' },
  { label: 'Scheduling', value: 'scheduling' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
] as const

export const CRM_ACTIVITY_TYPE_OPTIONS = [
  { label: 'Note', value: 'note' },
  { label: 'Call', value: 'call' },
  { label: 'Email', value: 'email' },
  { label: 'Text', value: 'text' },
  { label: 'Task event', value: 'task_event' },
  { label: 'Appointment', value: 'appointment' },
  { label: 'System', value: 'system' },
] as const

export const CRM_ACTIVITY_DIRECTION_OPTIONS = [
  { label: 'Inbound', value: 'inbound' },
  { label: 'Outbound', value: 'outbound' },
  { label: 'Internal', value: 'internal' },
  { label: 'System', value: 'system' },
] as const

export const CRM_TASK_STATUS_OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Waiting', value: 'waiting' },
  { label: 'Completed', value: 'completed' },
  { label: 'Canceled', value: 'canceled' },
] as const

export const CRM_TASK_TYPE_OPTIONS = [
  { label: 'Call', value: 'call' },
  { label: 'Email', value: 'email' },
  { label: 'Text', value: 'text' },
  { label: 'Quote follow-up', value: 'quote_follow_up' },
  { label: 'Billing follow-up', value: 'billing_follow_up' },
  { label: 'Scheduling', value: 'scheduling' },
  { label: 'General', value: 'general' },
] as const

export const CRM_SEQUENCE_STATUS_OPTIONS = [
  { label: 'Queued', value: 'queued' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
  { label: 'Exited', value: 'exited' },
  { label: 'Failed', value: 'failed' },
] as const

export const CRM_SEQUENCE_DEFINITION_STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
] as const

export const CRM_SEQUENCE_AUDIENCE_OPTIONS = [
  { label: 'Lead', value: 'lead' },
  { label: 'Opportunity', value: 'opportunity' },
  { label: 'Customer', value: 'customer' },
  { label: 'Billing', value: 'billing' },
] as const

export const CRM_SEQUENCE_TRIGGER_OPTIONS = [
  { label: 'Manual', value: 'manual' },
  { label: 'Lead created', value: 'lead_created' },
  { label: 'Quote sent', value: 'quote_sent' },
  { label: 'Quote accepted', value: 'quote_accepted' },
  { label: 'Appointment booked', value: 'appointment_booked' },
  { label: 'Invoice issued', value: 'invoice_issued' },
  { label: 'Invoice overdue', value: 'invoice_overdue' },
  { label: 'Job completed', value: 'job_completed' },
] as const

export const CRM_SEQUENCE_STEP_TYPE_OPTIONS = [
  { label: 'Wait', value: 'wait' },
  { label: 'Send email', value: 'send_email' },
  { label: 'Create task', value: 'create_task' },
  { label: 'Finish', value: 'finish' },
] as const

export const CRM_SEQUENCE_DELAY_UNIT_OPTIONS = [
  { label: 'Minutes', value: 'minutes' },
  { label: 'Hours', value: 'hours' },
  { label: 'Days', value: 'days' },
  { label: 'Weeks', value: 'weeks' },
] as const
