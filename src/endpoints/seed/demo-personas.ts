/**
 * Canonical cast for demo seed (runs by default with `npm run seed`; set `SEED_SKIP_DEMO=true` to skip).
 * Login: `email` + shared password. Notification routing for outbound comms: use
 * `DEMO_NOTIFICATION_EMAIL` on invoices/quotes/leads (`customerEmail` etc.), not login email.
 *
 * Option A: three CRM accounts (residential, HOA, commercial) with eight portal users total.
 */

export const DEMO_CUSTOMER_PASSWORD = 'changethis' as const

/** Dev inbox for Resend / seeded document `customerEmail` fields (not auth identity). */
export const DEMO_NOTIFICATION_EMAIL = 'b2gdevs@gmail.com' as const

export const DEMO_EMAIL_DOMAIN = 'demo.grimetime.app' as const

export type DemoAccountType = 'residential' | 'hoa_multifamily' | 'commercial'

export type DemoAccountSeed = {
  /** Stable key for upserts */
  key: string
  /** Shown in CRM */
  name: string
  accountType: DemoAccountType
}

export const demoAccounts: DemoAccountSeed[] = [
  {
    key: 'demo-chen-household',
    name: 'Chen household',
    accountType: 'residential',
  },
  {
    key: 'demo-sunset-ridge-hoa',
    name: 'Sunset Ridge HOA',
    accountType: 'hoa_multifamily',
  },
  {
    key: 'demo-lakeside-retail',
    name: 'Lakeside Retail Group',
    accountType: 'commercial',
  },
]

export type DemoPersonaSeed = {
  /** Stable slug for upserts (email local-part) */
  key: string
  name: string
  email: string
  accountKey: string
  /** Narrative for seed docs — not a Payload field */
  notes: string
}

export const demoPersonas: DemoPersonaSeed[] = [
  {
    key: 'jordan.chen',
    name: 'Jordan Chen',
    email: `jordan.chen@${DEMO_EMAIL_DOMAIN}`,
    accountKey: 'demo-chen-household',
    notes: 'Primary homeowner; recurring plan + completed job history; refund/dispute dry-run persona.',
  },
  {
    key: 'sam.chen',
    name: 'Sam Chen',
    email: `sam.chen@${DEMO_EMAIL_DOMAIN}`,
    accountKey: 'demo-chen-household',
    notes: 'Partner on same account; split invoices / portal visibility.',
  },
  {
    key: 'alex.kim',
    name: 'Alex Kim',
    email: `alex.kim@${DEMO_EMAIL_DOMAIN}`,
    accountKey: 'demo-chen-household',
    notes: 'Third portal user on residential account (e.g. roommate) — schedule / estimates focus.',
  },
  {
    key: 'morgan.park',
    name: 'Morgan Park',
    email: `morgan.park@${DEMO_EMAIL_DOMAIN}`,
    accountKey: 'demo-sunset-ridge-hoa',
    notes: 'Board president; HOA-facing quotes and approvals.',
  },
  {
    key: 'riley.torres',
    name: 'Riley Torres',
    email: `riley.torres@${DEMO_EMAIL_DOMAIN}`,
    accountKey: 'demo-sunset-ridge-hoa',
    notes: 'Property manager contact; on-site coordination.',
  },
  {
    key: 'casey.nguyen',
    name: 'Casey Nguyen',
    email: `casey.nguyen@${DEMO_EMAIL_DOMAIN}`,
    accountKey: 'demo-lakeside-retail',
    notes: 'Store GM; commercial pipeline / opportunities.',
  },
  {
    key: 'drew.okonkwo',
    name: 'Drew Okonkwo',
    email: `drew.okonkwo@${DEMO_EMAIL_DOMAIN}`,
    accountKey: 'demo-lakeside-retail',
    notes: 'Operations / facilities; appointments and day-board context.',
  },
  {
    key: 'jamie.patel',
    name: 'Jamie Patel',
    email: `jamie.patel@${DEMO_EMAIL_DOMAIN}`,
    accountKey: 'demo-lakeside-retail',
    notes: 'Billing / AP; invoice and Stripe test flows.',
  },
]
