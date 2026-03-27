export const accountBillingModeOptions = [
  { label: 'Autopay subscription', value: 'autopay_subscription' },
  { label: 'Send invoice - terms', value: 'send_invoice_terms' },
  { label: 'Send invoice - due on receipt', value: 'send_invoice_due_on_receipt' },
  { label: 'Manual internal billing', value: 'manual_internal' },
] as const

export const accountBillingRollupModeOptions = [
  { label: 'Per service', value: 'per_service' },
  { label: 'Monthly consolidated', value: 'monthly_consolidated' },
  { label: 'Subscription', value: 'subscription' },
] as const

export const accountPortalAccessModeOptions = [
  { label: 'No Stripe portal', value: 'none' },
  { label: 'Stripe billing only', value: 'stripe_only' },
  { label: 'App and Stripe', value: 'app_and_stripe' },
] as const

export const invoiceCollectionMethodOptions = [
  { label: 'Charge automatically', value: 'charge_automatically' },
  { label: 'Send invoice', value: 'send_invoice' },
] as const

export const invoicePaymentSourceOptions = [
  { label: 'Stripe', value: 'stripe' },
  { label: 'Onsite', value: 'onsite' },
  { label: 'Check', value: 'check' },
  { label: 'Cash', value: 'cash' },
  { label: 'Bank transfer', value: 'bank_transfer' },
  { label: 'Other', value: 'other' },
] as const

export const invoiceDeliveryStatusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Queued', value: 'queued' },
  { label: 'Sent', value: 'sent' },
  { label: 'Viewed', value: 'viewed' },
  { label: 'Failed', value: 'failed' },
] as const

export const servicePlanBillingModeOptions = [
  { label: 'Autopay subscription', value: 'autopay_subscription' },
  { label: 'Subscription billed by invoice', value: 'subscription_send_invoice' },
  { label: 'Monthly consolidated invoice', value: 'monthly_consolidated' },
  { label: 'Per service invoice', value: 'per_service_invoice' },
] as const

export const appointmentBillableStatusOptions = [
  { label: 'Not billable', value: 'not_billable' },
  { label: 'Ready to bill', value: 'ready_to_bill' },
  { label: 'Billed', value: 'billed' },
  { label: 'Paid onsite', value: 'paid_onsite' },
] as const

export const billingEventTypeOptions = [
  { label: 'Invoice synced', value: 'invoice_synced' },
  { label: 'Invoice sent', value: 'invoice_sent' },
  { label: 'Invoice viewed', value: 'invoice_viewed' },
  { label: 'Invoice paid', value: 'invoice_paid' },
  { label: 'Invoice overdue', value: 'invoice_overdue' },
  { label: 'Payment recorded', value: 'payment_recorded' },
  { label: 'Discount applied', value: 'discount_applied' },
  { label: 'Credit issued', value: 'credit_issued' },
  { label: 'Refund issued', value: 'refund_issued' },
  { label: 'Write-off applied', value: 'write_off_applied' },
  { label: 'Portal session created', value: 'portal_session_created' },
  { label: 'Webhook received', value: 'webhook_received' },
  { label: 'Subscription synced', value: 'subscription_synced' },
] as const

export const billingEventSourceOptions = [
  { label: 'Stripe', value: 'stripe' },
  { label: 'Internal', value: 'internal' },
] as const

export const adminBillingActionOptions = [
  'sync_send_invoice',
  'mark_paid_out_of_band',
  'apply_discount',
  'issue_credit',
  'issue_refund',
  'mark_uncollectible',
] as const

export type AdminBillingAction = (typeof adminBillingActionOptions)[number]
