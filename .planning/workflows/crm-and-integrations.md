# CRM & integrations map (Grime Time)

**Owner:** TBD  
**Last reviewed:** 2026-03-24  
**CRM choice:** EngageBay default, provider-abstracted with HubSpot fallback.

## Single pane of glass

| Data / action | Source of truth | How it gets there |
|---------------|-----------------|-------------------|
| Page copy, SEO, layout | **Payload** (`pages`, globals) | Admin UI |
| Uploaded images/files | **Supabase Storage** (`media` bucket) + Payload `media` docs | Admin upload |
| Form submission archive | **Payload** `form-submissions` | Public form POST |
| Lead contact (email/name/phone) | **Active CRM provider** | `beforeFormSubmissionCrm` -> provider adapter |
| Full form text (message, extras) | **CRM note / activity** when supported | Same provider adapter |
| Internal quote drafts and economics | **Payload** `quotes` | Admin only |
| Quote follow-up pipeline | **Active CRM provider** deals | Quote sync layer (HubSpot write path live; other providers later) |
| Booking / scheduler UX | **First-party form** | `/schedule` native form |

## Environment variables

See `.env.example` for the full list. Integration-related:

- **EngageBay REST:** `ENGAGEBAY_API_KEY`, `ENGAGEBAY_SYNC_FORM_SUBMISSIONS`, `ENGAGEBAY_SUBMISSION_TAG`, `ENGAGEBAY_ATTACH_SUBMISSION_NOTE`
- **HubSpot REST:** `HUBSPOT_ACCESS_TOKEN` or `HUBSPOT_PRIVATE_APP_TOKEN`, optional `HUBSPOT_ATTACH_SUBMISSION_NOTE`
- **HubSpot quote sync:** `HUBSPOT_QUOTE_DEAL_PIPELINE_ID`, `HUBSPOT_QUOTE_DEAL_STAGE_SENT`, optional `HUBSPOT_QUOTE_DEAL_STAGE_ACCEPTED`, `HUBSPOT_QUOTE_DEAL_STAGE_LOST`, `HUBSPOT_QUOTE_OWNER_ID`, `HUBSPOT_ATTACH_QUOTE_NOTE`, `HUBSPOT_QUOTE_CLOSE_DAYS`
- **Quotes:** `QUOTES_INTERNAL_ENABLED`, `QUOTES_INTERNAL_EMAILS`
- **Supabase media:** `SUPABASE_URL`, `SUPABASE_S3_*`, `SUPABASE_STORAGE_BUCKET`

## Code touchpoints

| Area | Path |
|------|------|
| Form -> CRM | [`src/hooks/beforeFormSubmissionCrm.ts`](../../src/hooks/beforeFormSubmissionCrm.ts), [`src/lib/crm`](../../src/lib/crm), lead extract [`src/utilities/formSubmissionLead.ts`](../../src/utilities/formSubmissionLead.ts) |
| Quotes -> CRM deals | [`src/hooks/beforeQuoteCrm.ts`](../../src/hooks/beforeQuoteCrm.ts), [`src/lib/crm/index.ts`](../../src/lib/crm/index.ts), [`src/lib/crm/providers/hubspot.ts`](../../src/lib/crm/providers/hubspot.ts), [`src/collections/Quotes/index.ts`](../../src/collections/Quotes/index.ts) |
| Runtime provider control | [`src/components/portal/CrmProviderCard.tsx`](../../src/components/portal/CrmProviderCard.tsx), [`src/app/api/internal/crm-provider/route.ts`](../../src/app/api/internal/crm-provider/route.ts) |
| HubSpot ops reads (admin `/ops` only) | [`src/lib/hubspot/opsClient.ts`](../../src/lib/hubspot/opsClient.ts), [`src/lib/hubspot/accessToken.ts`](../../src/lib/hubspot/accessToken.ts), [`src/app/api/internal/hubspot/health/route.ts`](../../src/app/api/internal/hubspot/health/route.ts), [`tasks/route.ts`](../../src/app/api/internal/hubspot/tasks/route.ts), [`pipeline-summary/route.ts`](../../src/app/api/internal/hubspot/pipeline-summary/route.ts) |
| Legacy EngageBay browser scripts | [`src/components/EngageBayTracking`](../../src/components/EngageBayTracking), [`src/components/EngageBayScheduleForm`](../../src/components/EngageBayScheduleForm) |
| Quotes access | [`src/utilities/quotesAccess.ts`](../../src/utilities/quotesAccess.ts), [`src/collections/Quotes`](../../src/collections/Quotes) |

## HubSpot private app scopes

When using HubSpot for the internal `/ops` day board, pipeline KPIs, and quote-to-deal sync, the private app token needs at least:

- **CRM -> deals** read (search/list open deals for pipeline sum; v1 uses up to 100 deals per request).
- **CRM -> deals** write (create/update mirrored deals from Payload quotes).
- **CRM -> contacts** write (create/update the contact attached to a mirrored quote deal).
- **CRM -> tasks** read/search (tasks filtered by `hs_timestamp` for the selected local calendar day).
- **CRM -> notes** write (attach quote-detail and form-submission notes when enabled).
- **CRM -> owners** read (or equivalent scope for listing owners) so task `hubspot_owner_id` values can be resolved to display names on the day board (`hubSpotOwnersNameMap` in `src/lib/hubspot/opsClient.ts`). If the token lacks this scope, tasks still load but may show raw owner IDs.

Tasks and deals are fetched only when HubSpot is the active runtime provider and the token env var is set. Quote-to-deal sync also only runs when HubSpot is active, and it uses env-mapped stage ids instead of hardcoded pipeline assumptions. See decisions **D-crm-003** and **D-crm-004** in `.planning/DECISIONS.xml`.

## Runtime switching

- The active CRM provider is selected at runtime from the admin ops dashboard (`/ops`).
- Current state is persisted in `.runtime/crm-provider.json`.
- This is intentionally migration-free for now.
- This persistence model is suitable for local and single-instance deployments. Revisit it before moving to stateless or multi-instance infrastructure.

## Current HubSpot quote sync shape

1. **Payload quote stays the source of truth** for pricing, tax notes, and customer-facing estimate data.
2. **Quote saves in `sent`, `accepted`, or `lost` status trigger CRM sync** through `src/hooks/beforeQuoteCrm.ts`.
3. **HubSpot creates or updates one mirrored deal per quote** using the stored deal id on `quotes.crm.dealId`.
4. **Quote status maps to HubSpot deal stage ids from env vars**, so the production portal can change pipelines without code edits.
5. **Write-back from HubSpot into Payload remains out of scope** until one-way sync is proven stable.

## Future

- Inbound CRM webhooks -> Payload
- Optional write-back from CRM deal stage to Payload quote status
- Decide whether runtime provider state should stay file-based or move into Payload once schema work is approved

## EngageBay vs HubSpot (working summary)

| Topic | EngageBay | HubSpot |
|-------|-----------|---------|
| Cost / SMB fit | Often favorable for all-in-one SMB | Higher tiers for full API/automation |
| API maturity | Good enough for current lead sync, but thinner | Stronger ecosystem and app model |
| Current repo posture | Default active provider | Fallback provider path ready |
