# Payload-native CRM, billing, and lifecycle automation

**Owner:** TBD  
**Last reviewed:** 2026-03-24  
**Direction:** Keep Grime Time operationally in-house. Payload is the CRM system of record. Resend handles outbound email delivery. Stripe handles billing and payments.

## Product posture

- **Payload is the database and workflow engine.** We are not outsourcing the core customer lifecycle to HubSpot or EngageBay.
- **Customer surfaces stay compact and simple.** Customers should mainly be able to:
  - request a quote
  - view estimates
  - approve and pay invoices
  - manage account/contact details
  - review or request schedule changes
- **Admin surfaces can be denser, but still business-oriented.** `/ops` should feel like a practical operating console, not a marketing dashboard.
- **The MCP server matters because content and demo data should be filled continuously while we build.** Payload should not stay structurally correct but empty.

## Design rules

### Customer experience

- Keep customer pages focused on one primary task per area.
- Avoid jargon, internal process language, or admin-only controls.
- Billing and account management must be obvious and low-friction.
- The customer dashboard should answer:
  - what do I owe?
  - what is scheduled?
  - what quote or estimate is waiting on me?
  - how do I update my info or ask for help?

### Admin / ops experience

- Favor **compact, scan-friendly density** over oversized marketing cards.
- Keep KPI cards short and defensible; every metric needs a defined source.
- Do not hide core operating details behind deep navigation if they are needed daily.
- Prefer Payload CRUD plus focused custom views over spreading business state across many external tools.

## System of record

| Domain | System of record | Notes |
|-------|------------------|-------|
| Marketing pages and docs | Payload | Seed-first plus ongoing MCP-assisted content fill |
| Leads, contacts, accounts, pipeline, activities, tasks | Payload | New in-house CRM model |
| Quotes / estimates | Payload | Existing `quotes` collection remains core |
| Scheduling and service appointments | Payload | Existing service collections continue |
| Billing, invoices, payments, subscriptions | Payload + Stripe | Payload stores business records; Stripe processes payment events |
| Email delivery and sequence sending | Payload jobs + Resend | Sequence state lives in Payload, delivery through Resend |

## Core CRM entities

These are the main business records the app should own directly.

| Entity | Purpose | Missing / needs work |
|-------|---------|----------------------|
| **Lead** | First inbound request before qualification | Need dedicated collection instead of relying only on generic `form-submissions` |
| **Account** | Household or business relationship | Need clear grouping of users, contacts, service locations, opportunities, invoices |
| **Contact** | Person-level communication target | Need primary / billing / onsite roles and unsubscribe state |
| **Opportunity** | Pipeline record tied to a quote or requested service | Need stages, value, owner, next action, source, close reason |
| **Activity** | Logged calls, emails, notes, appointment outcomes | Need timeline collection and admin read/write UX |
| **Task** | Follow-up work item | Need due dates, assignee, completion, auto-generated tasks |
| **Sequence enrollment** | Automated follow-up cadence | Need template set, cadence rules, pause/exit conditions |
| **Service location** | Customer property / job site | Need better normalization across quotes, appointments, subscriptions |
| **Subscription / maintenance plan** | Recurring service agreement | Existing `service-plans` exist, but billing sync and lifecycle states need expansion |
| **Invoice / payment record** | Amount due, status, Stripe linkage | Existing `invoices` collection needs Stripe event mapping and customer payment actions |

## Billing and payments

Use Stripe for payment rails, but keep business meaning in Payload.

### Stripe responsibilities

- checkout/payment links
- subscription billing
- card/bank payment method handling
- webhooks for payment state changes

### Payload responsibilities

- invoice document and internal billing context
- customer-visible invoice history
- subscription/service-plan policy
- dunning and reminder state
- operational meaning of paid / overdue / canceled

### Required env contract

- `STRIPE_SECRET_KEY`
- `STRIPE_ACCOUNT_ID`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `CRON_SECRET`

## Lifecycle automation with Payload jobs

Payload background jobs should own business follow-up logic.

Initial automation targets:

1. lead received -> assign queue/state and send internal notification
2. quote sent -> start follow-up sequence
3. appointment booked -> confirmation email and reminder jobs
4. invoice issued -> billing reminder sequence
5. overdue invoice -> dunning cadence
6. completed job -> review request + maintenance-plan offer

## Content and demo data expectations

- Seed enough realistic customers, leads, opportunities, quotes, invoices, plans, and appointments to exercise every main screen.
- Fill public pages and admin docs continuously; do not treat content as an afterthought.
- Use MCP-assisted writes where helpful so the CMS becomes populated while features are built.

## Testing expectations

- **Unit tests:** quote math, subscription math, pipeline formulas, email-sequence state logic, Stripe webhook handlers.
- **Integration tests:** form submission -> lead creation, invoice state changes, job creation, sequence enrollment.
- **Playwright:** customer dashboard, quote acceptance, billing/account edits, schedule request flow, admin `/ops` queue views.
- **Seeded demo scenarios:** residential lead, commercial lead, accepted quote, overdue invoice, active subscription, completed service.

## Immediate implementation slices

1. remove third-party CRM assumptions from visible UX and copy
2. stop outbound CRM sync; keep lead capture fully internal
3. define first-party CRM schema (`leads`, `accounts`, `contacts`, `opportunities`, `activities`, `tasks`)
4. wire `/ops` to Payload-native follow-up queue instead of provider toggle
5. add Stripe-backed invoice/payment workflow
6. add Resend template + sequence engine using Payload jobs
7. expand seed/demo data and test coverage before deeper portal polish
