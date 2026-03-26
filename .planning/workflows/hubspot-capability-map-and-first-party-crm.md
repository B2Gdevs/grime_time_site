# HubSpot capability map and first-party CRM

**Owner:** Grime Time product and implementation team  
**Tools:** Payload CMS, Next.js App Router, Payload jobs, Stripe, Resend  
**Last reviewed:** 2026-03-25

## Why this exists

We are not integrating with HubSpot or EngageBay anymore, but we still want the parts of HubSpot that matter operationally:

- structured business records
- fast search and filtered queues
- clear ownership and follow-up discipline
- timeline activity history
- pipeline stages and next actions
- simple sequence enrollment and status

This doc turns that model into first-party Payload collections, Next.js API routes, Stripe webhook handlers, and compact admin UI requirements.

## Official capability model we are mirroring

HubSpot's official CRM docs frame the product around:

- objects and records
- properties
- associations between records
- pipelines and stages
- owners
- search APIs
- leads
- tasks and notes
- sequences

Useful references:

- HubSpot CRM overview: https://developers.hubspot.com/docs/guides/crm/understanding-the-crm
- Associations API: https://developers.hubspot.com/docs/api-reference/crm-associations-v4/guide
- Pipelines API: https://developers.hubspot.com/docs/api-reference/crm-pipelines-v3/guide
- Search API: https://developers.hubspot.com/docs/api-reference/crm-objects-v3/search/post-crm-v3-objects-objectType-search
- Owners API: https://developers.hubspot.com/docs/api-reference/crm-crm-owners-v3/guide
- Leads API: https://developers.hubspot.com/docs/api-reference/crm-leads-v3/guide
- Tasks API: https://developers.hubspot.com/docs/api-reference/crm-tasks-v3/guide
- Notes API: https://developers.hubspot.com/docs/api-reference/crm-notes-v3/guide
- Sequences API: https://developers.hubspot.com/docs/api-reference/automation-sequences-v4/guide
- Stripe webhooks: https://docs.stripe.com/webhooks
- Stripe subscription webhooks: https://docs.stripe.com/billing/subscriptions/webhooks

## First-party mapping

| HubSpot concept | First-party Grime Time shape | Current repo anchor | Next implementation target |
|---|---|---|---|
| Contacts | `contacts` collection linked to `users`, accounts, opportunities, activities, and consent state | `src/collections/Contacts/index.ts` | API routes and queue UI |
| Companies / accounts | `accounts` collection for household or business relationship, billing defaults, service locations, AP/billing terms, tax-exempt handling, and ownership | `src/collections/Accounts/index.ts` | account queue views, conversion flows, and commercial billing logic |
| Leads | `leads` collection created from public forms before qualification | `src/collections/Leads/index.ts`, `src/lib/crm/index.ts` | form-to-lead writes and dedupe |
| Deals | `opportunities` collection tied to quotes, pipeline, close value, source, and next step | `src/collections/Opportunities/index.ts`, `src/collections/Quotes/index.ts` | lifecycle hooks and queue summaries |
| Owners | use `users` plus assignment fields on CRM records and queues | `src/collections/Users/index.ts` | extend existing auth users and queue helpers |
| Associations | explicit relationships between leads, contacts, accounts, quotes, invoices, plans, appointments, and activities | `src/payload-types.ts`, `src/payload.config.ts` | normalized relationship fields plus helper queries |
| Tasks | `crm-tasks` collection with due date, priority, status, owner, stale rules, and related record links | `src/collections/CrmTasks/index.ts` | queue actions and stale-state logic |
| Notes / timeline | `crm-activities` collection for notes, calls, emails, schedule events, and system events | `src/collections/CrmActivities/index.ts` | timeline reads and write APIs |
| Pipelines and stages | admin-managed pipeline definitions and stage configs for lead and opportunity flow | `src/globals/InternalOpsSettings/config.ts` | planned `src/globals/CrmSettings/config.ts` or dedicated collections |
| Search | internal search/list endpoints with filters, sort, paging, stale/follow-up status, and saved queue views | `src/app/api/internal/crm/workspace/route.ts`, `src/app/api/internal/crm/record/route.ts`, `src/lib/crm/workspace/*` | add search, write actions, and saved views |
| Sequences | in-app sequence definitions plus enrollments, step state, pauses, exits, and audit trail | `src/collections/CrmSequences/index.ts`, `src/collections/SequenceEnrollments/index.ts`, `src/payload.config.ts` | jobs, templates, builder UI, and enrollment runners |
| Billing objects | internal invoice and service-plan state reconciled from Stripe events | `src/collections/Invoices/index.ts`, `src/collections/ServicePlans/index.ts` | Stripe webhook route and reconciliation service |

## What we should copy from HubSpot

- object-based CRM records with clean ownership
- association-first thinking between records
- list views with filter, sort, priority, and stale-state scanning
- timeline activities with manual notes and system events
- pipeline stages with next-action accountability
- enrollment-driven sequences with visible status

## What we should not copy blindly

- excessive settings surface area before the workflow exists
- over-generalized custom object complexity on day one
- a wide, noisy UI with too many competing cards
- vendor-specific terminology where Grime Time needs operational clarity

## UI requirements for the compact CRM workspace

The UI should follow the current portal shell and shared components, but move toward a denser operator workspace.

Required behaviors:

- one primary CRM workspace inside `/ops`
- compact queue tables with owner, status, priority, age, and next action
- left-side list or queue selection with a non-overlapping detail pane
- tabs, tab groups, and button groups for dense switching without layout breakage
- icons and badges used consistently, not decoratively
- info icons and tooltips only where the metric, stage, or status needs explanation
- priority sorting and stale-contact detection built into default queues
- avoid overflow-heavy or overlapping content; prefer stable in-page regions over stacked drawers
- customer portal remains simple: estimates, invoices, billing, schedule, account

Relevant current files:

- `src/app/(portal)/ops/page.tsx`
- `src/components/data-table.tsx`
- `src/components/app-sidebar.tsx`
- `src/components/portal/AdminDashboardView.tsx`

## Core gaps right now

1. We now have the first-party CRM collections, and public form submissions plus quote lifecycle now write internal lead/account/contact/opportunity/task/activity records. Deeper conversion rules, dedupe, and owner-routing are still missing.
2. `/ops` now has a real CRM workspace tab with queue groups, summary metrics, server-backed search, stale-only filtering, structured record detail, inline note logging, and first inline actions, but it still lacks broader write flows and stronger saved filtering.
3. Commercial account handling is present in schema and exposed in the companies queue, and the left rail now shows richer company fields, but billing actions, multi-site depth, and commercial-first defaults still need more depth.
4. Sequence definitions and enrollments now exist in schema and show up in the automation queue, but the builder UX, template system, job runners, and retry logic are not implemented.
5. Invoice and service-plan records exist, but Stripe webhook reconciliation does not.
6. We have initial integration and Playwright coverage for the CRM workspace, but we still need realistic demo data and broader end-to-end coverage before deeper visual polish.

## Recommended implementation order

### Phase 07-01: CRM foundation

- create `leads`, `accounts`, `contacts`, `opportunities`, `crm-activities`, `crm-tasks`, and `sequence-enrollments`
- add commercial account fields and in-app sequence definition records
- write public form submissions and quote status changes into the first-party CRM records
- normalize ownership, status, priority, stale dates, and source fields
- link CRM objects to `quotes`, `invoices`, `service-plans`, `service-appointments`, and `users`

### Phase 07-02: CRM API and query layer

- build internal routes for list, detail, activity create, task create/update, and queue summaries
- add stale-follow-up and next-action query helpers
- make local API calls access-safe with `overrideAccess: false` whenever a user context is passed

Current repo anchors:

- `src/app/api/internal/crm/workspace/route.ts`
- `src/app/api/internal/crm/record/route.ts`
- `src/app/api/internal/crm/activity/route.ts`
- `src/app/api/internal/crm/task/route.ts`
- `src/app/api/internal/crm/opportunity/route.ts`
- `src/lib/crm/workspace/activity.ts`
- `src/lib/crm/workspace/actions.ts`
- `src/lib/crm/workspace/queries.ts`
- `src/lib/crm/workspace/detail.ts`

### Phase 07-03: Compact CRM workspace UI

- replace placeholder ops sections with real queues
- show list/detail split, tabs, button groups, badges, icons, priorities, stale flags, info icons, and tooltips
- keep customer nav free of admin tools and quote-settings links
- avoid overlapping panels and overflow-prone layouts unless absolutely necessary

Current repo anchors:

- `src/components/portal/command-center/ops-command-center.tsx`
- `src/components/portal/command-center/section-rail.tsx`
- `src/components/portal/crm/CrmWorkspace.tsx`
- `src/components/portal/crm/CrmCommandCenterDetail.tsx`
- `src/components/portal/crm/CrmWorkspaceQueueList.tsx`
- `src/components/portal/crm/CrmWorkspaceNoteComposer.tsx`
- `src/components/portal/crm/CrmWorkspaceToolbar.tsx`
- `src/components/portal/crm/CrmWorkspaceItemActions.tsx`

### Phase 07-04: Stripe sync

- add Stripe webhook endpoint
- verify signatures with `STRIPE_WEBHOOK_SECRET`
- reconcile `invoices`, `service-plans`, and customer billing status idempotently
- surface payment failures and upcoming renewals in admin and customer views

### Phase 07-05: Sequences and automation

- define email templates and sequence steps in Payload with an in-app builder
- use Payload jobs for delayed steps, retries, exits, and audit logging
- send through Resend and store delivery intent and result metadata

### Phase 07-06: Demo data and tests

- seed residential, commercial, overdue, active-subscription, and stale-follow-up scenarios
- add unit tests for queue rules, stage math, webhook idempotency, and sequence state logic
- add Playwright coverage for `/ops`, customer billing, account edits, and schedule flows

Current repo anchors:

- `tests/int/lib/crm/workspace.int.spec.ts`
- `tests/e2e/admin.e2e.spec.ts`
- `tests/e2e/frontend.e2e.spec.ts`
- `playwright.config.ts`

## Env contract for this phase

- `STRIPE_SECRET_KEY`
- `STRIPE_ACCOUNT_ID`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `CRON_SECRET`

## Notes on implementation style

- Treat Payload as the operational database, not a passive CMS.
- Prefer compact, business-oriented UI density over oversized cards.
- Keep customer surfaces low-friction and task-focused.
- Keep admin data editable in Payload, but ensure `/ops` and portal routes actually read and act on that data rather than leaving it stranded in admin-only CRUD.
