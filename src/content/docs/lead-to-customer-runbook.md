# Lead -> customer - operational runbook

**Owner:** TBD  
**Last reviewed:** 2026-03-24  
**Audience:** Grime Time staff. Keep aligned with [Internal docs policy](../../.planning/workflows/internal-docs-policy.md).

**Where to read this:** Portal **Docs** at `/docs/lead-to-customer-runbook` for signed-in staff.

## Systems

| System | Role |
|--------|------|
| **Public site** (Payload + Next.js) | Marketing pages, quote/contact forms; **scheduling intake** is optional on the home instant quote block (`/#instant-quote`). Legacy `/schedule` redirects there. |
| **Payload admin** | Content, Media, Form submissions, Quotes (internal, gated) |
| **Payload-native CRM** | Leads, contacts, accounts, activities, tasks, opportunities, and follow-up state |
| **Resend + Stripe** | Email delivery and billing/payment rails |

## Happy path (website lead)

1. Visitor submits a site form -> stored in **Form submissions** (`form-submissions`, admin under **Leads**).
2. `leadEmail` / `leadName` are filled automatically from common field names.
3. The server-side create path stores the lead in Payload first and should enroll it into internal follow-up workflow as the CRM model expands.
4. Activities, notes, assignments, and reminders should live in Payload collections and jobs.
5. Staff works the lead from the internal queue and related account records.
6. If a formal quote is needed before close, staff creates a **Quotes** record in Payload under **Internal**.

## Scheduling path (instant quote + optional scheduling)

1. Visitor uses the home **Instant quote** section and may turn on **Also request scheduling** (preferred window, property type, optional date, notes).
2. Submissions post to `/api/lead-forms/instant-quote` with `leadSource: instant_quote` and extra rows when scheduling is requested (`schedulingRequested`, `propertyType`, `preferredWindow`, etc.); CRM parses combined quote + scheduling as `scheduling_support` when scheduling is requested.
3. The standalone `/schedule` route only redirects clients to `/#instant-quote` (the dedicated schedule API remains for legacy/testing if needed).
4. Staff confirms the real calendar window from the internal queue and service records.

## Ownership

| Step | Owner |
|------|--------|
| Form copy, fields, and thank-you behavior | Marketing + dev |
| Internal CRM stages, tasks, and ownership rules | Ops + CRM admin |
| Internal quote drafts & status | Sales / ops |
| Texas tax / final pricing authority | Leadership + CPA |

## Quick checks

- [ ] Test form submission -> row in Payload + internal lead/account record + assigned follow-up task.
- [ ] Allowlisted emails can open **Quotes** when `QUOTES_INTERNAL_ENABLED=true`.
- [ ] Public site never links to `/admin` or internal collections.
- [ ] `/ops` and the customer portal stay focused on internal workflow, not third-party provider toggles.

## Related docs

- [CRM and integrations](../../../.planning/workflows/crm-and-integrations.md)
- [Payload-native CRM and billing](../../../.planning/workflows/payload-native-crm-and-billing.md)
