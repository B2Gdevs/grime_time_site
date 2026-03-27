import {
  BadgeDollarSignIcon,
  CircleDollarSignIcon,
  CreditCardIcon,
  ReceiptTextIcon,
  ShieldAlertIcon,
} from 'lucide-react'

export const billingActionMeta = {
  apply_discount: {
    icon: BadgeDollarSignIcon,
    label: 'Discount',
    needsAmount: true,
  },
  issue_credit: {
    icon: CircleDollarSignIcon,
    label: 'Credit',
    needsAmount: true,
  },
  issue_refund: {
    icon: CreditCardIcon,
    label: 'Refund',
    needsAmount: true,
  },
  mark_paid_out_of_band: {
    icon: ReceiptTextIcon,
    label: 'Mark paid',
    needsAmount: false,
  },
  mark_uncollectible: {
    icon: ShieldAlertIcon,
    label: 'Write off',
    needsAmount: false,
  },
  sync_send_invoice: {
    icon: ReceiptTextIcon,
    label: 'Send invoice',
    needsAmount: false,
  },
} as const

export type BillingActionKind = keyof typeof billingActionMeta

