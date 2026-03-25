# CRM & integrations map (Grime Time)

**Owner:** TBD  
**Last reviewed:** 2026-03-24  
**CRM choice:** Payload-native CRM. Resend handles delivery. Stripe handles payment rails.

## Single pane of glass

| Data / action | Source of truth | How it gets there |
|---------------|-----------------|-------------------|
| Page copy, SEO, layout | **Payload** (`pages`, globals) | Admin UI + MCP-assisted content fill |
| Uploaded images/files | **Supabase Storage** (`media` bucket) + Payload `media` docs | Admin upload |
| Form submission archive | **Payload** `form-submissions` | Public form POST |
| Leads, contacts, accounts, opportunities, activities, tasks | **Payload** | First-party CRM collections and jobs |
| Internal quote drafts and economics | **Payload** `quotes` | Admin only |
| Quote follow-up pipeline | **Payload** opportunities derived from quotes | Internal workflow |
| Scheduling / service workload | **Payload** `service-appointments`, `service-plans` | Portal + admin flows |
| Billing, invoice state, customer account context | **Payload** + Stripe events | Admin actions + webhook updates |
| Email sequences, reminders, follow-up | **Payload jobs** + Resend | Background jobs + templates |

## Environment variables

See `.env.example` for the full list. Current integration-related env vars:

- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_ACCOUNT_ID`, `STRIPE_WEBHOOK_SECRET`
- **Email delivery:** `RESEND_API_KEY`
- **Jobs/security:** `CRON_SECRET`
- **Quotes:** `QUOTES_INTERNAL_ENABLED`, `QUOTES_INTERNAL_EMAILS`
- **Supabase media:** `SUPABASE_URL`, `SUPABASE_S3_*`, `SUPABASE_STORAGE_BUCKET`

## Code touchpoints

| Area | Path |
|------|------|
| Form capture + internal follow-up metadata | [`src/hooks/beforeFormSubmissionCrm.ts`](../../src/hooks/beforeFormSubmissionCrm.ts), [`src/lib/crm/index.ts`](../../src/lib/crm/index.ts), [`src/utilities/formSubmissionLead.ts`](../../src/utilities/formSubmissionLead.ts) |
| Quote lifecycle + future opportunity handoff | [`src/hooks/beforeQuoteCrm.ts`](../../src/hooks/beforeQuoteCrm.ts), [`src/collections/Quotes/index.ts`](../../src/collections/Quotes/index.ts) |
| Customer billing + service records | [`src/collections/Invoices/index.ts`](../../src/collections/Invoices/index.ts), [`src/collections/ServicePlans/index.ts`](../../src/collections/ServicePlans/index.ts), [`src/collections/ServiceAppointments/index.ts`](../../src/collections/ServiceAppointments/index.ts) |
| Ops dashboard | [`src/app/(portal)/ops/page.tsx`](../../src/app/(portal)/ops/page.tsx), [`src/components/data-table.tsx`](../../src/components/data-table.tsx), [`src/components/portal/OperatingDayCalendar.tsx`](../../src/components/portal/OperatingDayCalendar.tsx) |
| Product direction / data model | [`payload-native-crm-and-billing.md`](./payload-native-crm-and-billing.md) |

## Directional rules

1. Payload owns customer and pipeline state.
2. Stripe is the payment rail, not the business database.
3. Resend is the delivery rail, not the automation source of truth.
4. Payload jobs should own follow-up sequences, reminders, and dunning logic.
5. `/ops` should be powered by first-party records, not external provider toggles.

## Near-term implementation

1. Remove third-party CRM UI and runtime switching from the visible product.
2. Stop outbound CRM sync and keep lead capture internal.
3. Add first-party CRM collections for leads, accounts, contacts, opportunities, activities, and tasks.
4. Add Stripe webhook handling for invoice and subscription state.
5. Add Resend template + sequence orchestration through Payload jobs.
6. Expand demo data and test coverage so the CRM/billing flows are exercised continuously.
