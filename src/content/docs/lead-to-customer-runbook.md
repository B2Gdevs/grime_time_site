# Lead -> customer - operational runbook

**Owner:** TBD  
**Last reviewed:** 2026-03-24  
**Audience:** Grime Time staff. Keep aligned with [Internal docs policy](../../.planning/workflows/internal-docs-policy.md).

**Where to read this:** Portal **Docs** at `/docs/lead-to-customer-runbook` for signed-in staff.

## Systems

| System | Role |
|--------|------|
| **Public site** (Payload + Next.js) | Marketing pages, quote/contact forms, native `/schedule` request form |
| **Payload admin** | Content, Media, Form submissions, Quotes (internal, gated) |
| **CRM provider** | Contacts, notes/activities, tags, automation, ownership, and follow-up. EngageBay is default; HubSpot can be enabled as a fallback. |

## Happy path (website lead)

1. Visitor submits a site form -> stored in **Form submissions** (`form-submissions`, admin under **Leads**).
2. `leadEmail` / `leadName` are filled automatically from common field names.
3. The server-side create path syncs the lead into the active CRM provider and records `crmSyncStatus`, `crmSyncedAt`, and `crmSyncDetail` on the submission.
4. If the provider supports it, the submission field dump is attached as a CRM note or activity.
5. Staff works the lead in the active CRM.
6. If a formal quote is needed before close, staff creates a **Quotes** record in Payload under **Internal**.

## Scheduling path (`/schedule`)

1. Visitor submits the native schedule request form.
2. The app stores a Payload form submission through the same first-party form stack used by the quote and contact flows.
3. The CRM sync runs during the create path.
4. Staff confirms the real calendar window from the CRM follow-up process.

## Ownership

| Step | Owner |
|------|--------|
| Form copy, fields, and thank-you behavior | Marketing + dev |
| CRM fields, tags, pipelines, and provider choice | Ops + CRM admin |
| Internal quote drafts & status | Sales / ops |
| Texas tax / final pricing authority | Leadership + CPA |

## Quick checks

- [ ] Test form submission -> row in Payload + contact in the active CRM + note/activity where supported.
- [ ] Allowlisted emails can open **Quotes** when `QUOTES_INTERNAL_ENABLED=true`.
- [ ] Public site never links to `/admin` or internal collections.
- [ ] If more than one CRM is configured, `/ops` can switch providers successfully.

## Related docs

- [CRM and integrations](../../../.planning/workflows/crm-and-integrations.md)
- [Customer site and CRM](../../../.planning/workflows/customer-site-content-and-engagebay.md)
- [EngageBay integration review](../../../.planning/workflows/engagebay-integration-review.md)
