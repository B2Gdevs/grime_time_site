# EngageBay — integration review (pre-build)

**Owner:** TBD  
**Last reviewed:** 2026-03-21  
**Status:** Chosen as CRM direction; validate in a trial before production cutover.

## Implemented in repo (verify in your EngageBay trial)

- [x] API key in env; **create/update contact** from Payload form submissions (`POST .../subscribers/subscriber`).
- [x] Optional **tag** on contacts (`ENGAGEBAY_SUBMISSION_TAG`).
- [x] **Note** on contact with full form row dump (`POST .../notes`), skippable via `ENGAGEBAY_ATTACH_SUBMISSION_NOTE=false`.
- [ ] Rate limits / batch jobs for large imports — still N/A until volume requires it.
- [ ] Custom fields for lead source, service area — optional; extend [`syncFormSubmissionToEngageBay.ts`](../../src/lib/engagebay/syncFormSubmissionToEngageBay.ts).

## Official surfaces

- Marketing / developer hub: [EngageBay API for Developers](https://www.engagebay.com/api)
- GitHub org: [github.com/engagebay](https://github.com/engagebay) — includes [`restapi`](https://github.com/engagebay/restapi) and [`webhooks`](https://github.com/engagebay/webhooks) documentation repos

## API shape (typical)

- **Base URL:** `https://app.engagebay.com/` (per EngageBay REST docs)
- **Auth:** `Authorization` header with REST API key from **Account → Admin Settings → API**
- **Format:** JSON (XML mentioned in some marketing copy; confirm for your endpoints)
- **Entities:** Contacts, companies, deals, tasks, notes, forms, sequences, tags, tickets, products, custom fields, etc. (verify current list in official docs before schema design)

## Webhooks (outbound from EngageBay)

- Configured in account settings; events such as contact/deal create-update-delete, email engagement, etc.
- EngageBay **sends** webhooks to your URL; for **inbound** pushes from Payload/Next.js into EngageBay, use the **REST API** from your server (not incoming webhooks to EngageBay).

## SDKs

- EngageBay lists client libraries for **JavaScript, PHP, Java, .NET** on their API page — treat as convenience wrappers around REST.
- **Node/Next.js:** Plan on `fetch` or a thin typed client you own; confirm whether official JS SDK is maintained for your Node version.

## Fit for Grime Time

| Need | EngageBay angle |
|------|-----------------|
| Single org, mixed email domains | Invite users by email into one account (already documented in `crm-org-and-sync.md`). |
| Lead from Payload forms | Server action or route → `POST` contact (or use EngageBay form embed if you accept their UX). |
| Sequences / follow-up | Native marketing automation; map stages to your exterior-cleaning pipeline. |

## Before committing (checklist)

- [ ] Create trial account; generate API key; call one read endpoint (e.g. list contacts) from a local script.
- [ ] Confirm rate limits and batch APIs for any sync job.
- [ ] Map custom fields for lead source, service area, job type.
- [ ] Document subprocessors / data processing for customer PII (Texas + general compliance — legal review).

## Risks / unknowns

- Long-term API stability and depth vs HubSpot for niche integrations.
- Exact JSON schema per endpoint — always verify against live docs, not only GitHub mirrors.
