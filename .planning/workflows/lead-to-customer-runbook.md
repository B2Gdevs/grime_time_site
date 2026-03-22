# Lead → customer — operational runbook

**Owner:** TBD  
**Last reviewed:** 2026-03-21  
**Audience:** Grime Time staff (exterior cleaning). Keep aligned with [`internal-docs-policy.md`](./internal-docs-policy.md) (no customer PII in git).

## Systems

| System | Role |
|--------|------|
| **Public site** (Payload + Next.js) | Marketing pages, contact/lead forms, `/schedule` embed |
| **Payload admin** | Content, **Media** (Supabase Storage bucket `media`), **Form submissions**, **Quotes** (internal, gated) |
| **EngageBay** | CRM contacts, notes, tags, marketing automation, scheduling embed data |

## Happy path (website lead)

1. Visitor submits a **Payload form** on the site → stored in **Form submissions** (`form-submissions`, admin under **Leads**). `leadEmail` / `leadName` are filled automatically from common field names; **CRM** sidebar fields record EngageBay sync outcome.
2. Server sync (when `ENGAGEBAY_API_KEY` is set): **contact** upsert in EngageBay with email / name / phone.
3. **Note** on that contact (unless `ENGAGEBAY_ATTACH_SUBMISSION_NOTE=false`): full field dump from the form so message/custom fields appear in CRM.
4. Staff works the lead in **EngageBay** (sequences, tasks, deals — as you configure).
5. If a formal quote is needed before close: create a **Quotes** record in Payload (**Internal** group) — optional link to customer email for traceability. *No customer-facing quote PDF from the app yet.*

## Scheduling path (`/schedule`)

1. Visitor books via **EngageHub** embed (`ENGAGEBAY_SCHEDULE_FORM_ID`).
2. Engagement data lives primarily in **EngageBay**; ensure staff monitor CRM/calendar there.

## Ownership

| Step | Owner |
|------|--------|
| Form copy, fields, thank-you behavior | Marketing + dev (Payload Forms / blocks) |
| CRM fields, tags, pipelines | Ops + EngageBay admin |
| Internal quote drafts & status | Sales / ops (Payload **Quotes**) |
| Texas tax / final pricing authority | Leadership + **CPA** (see [`quote-system-and-texas-compliance.md`](./quote-system-and-texas-compliance.md)) |

## Quick checks

- [ ] Test form submission → row in Payload + contact in EngageBay + **note** with all fields.
- [ ] Allowlisted emails can open **Quotes** when `QUOTES_INTERNAL_ENABLED=true`.
- [ ] Public site never links to `/admin` or internal collections.

## Related docs

- [`crm-and-integrations.md`](./crm-and-integrations.md) — integration map and env vars  
- [`customer-site-content-and-engagebay.md`](./customer-site-content-and-engagebay.md) — URLs and CMS checklist  
- [`engagebay-integration-review.md`](./engagebay-integration-review.md) — API checklist and risks  
