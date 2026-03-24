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
| Quote follow-up pipeline | **Active CRM provider** deals | Planned quote-sync layer |
| Booking / scheduler UX | **First-party form** | `/schedule` native form |

## Environment variables

See `.env.example` for the full list. Integration-related:

- **EngageBay REST:** `ENGAGEBAY_API_KEY`, `ENGAGEBAY_SYNC_FORM_SUBMISSIONS`, `ENGAGEBAY_SUBMISSION_TAG`, `ENGAGEBAY_ATTACH_SUBMISSION_NOTE`
- **HubSpot REST:** `HUBSPOT_ACCESS_TOKEN` or `HUBSPOT_PRIVATE_APP_TOKEN`, optional `HUBSPOT_ATTACH_SUBMISSION_NOTE`
- **Quotes:** `QUOTES_INTERNAL_ENABLED`, `QUOTES_INTERNAL_EMAILS`
- **Supabase media:** `SUPABASE_URL`, `SUPABASE_S3_*`, `SUPABASE_STORAGE_BUCKET`

## Code touchpoints

| Area | Path |
|------|------|
| Form -> CRM | [`src/hooks/beforeFormSubmissionCrm.ts`](../../src/hooks/beforeFormSubmissionCrm.ts), [`src/lib/crm`](../../src/lib/crm), lead extract [`src/utilities/formSubmissionLead.ts`](../../src/utilities/formSubmissionLead.ts) |
| Runtime provider control | [`src/components/portal/CrmProviderCard.tsx`](../../src/components/portal/CrmProviderCard.tsx), [`src/app/api/internal/crm-provider/route.ts`](../../src/app/api/internal/crm-provider/route.ts) |
| Legacy EngageBay browser scripts | [`src/components/EngageBayTracking`](../../src/components/EngageBayTracking), [`src/components/EngageBayScheduleForm`](../../src/components/EngageBayScheduleForm) |
| Quotes access | [`src/utilities/quotesAccess.ts`](../../src/utilities/quotesAccess.ts), [`src/collections/Quotes`](../../src/collections/Quotes) |

## Runtime switching

- The active CRM provider is selected at runtime from the admin ops dashboard (`/ops`).
- Current state is persisted in `.runtime/crm-provider.json`.
- This is intentionally migration-free for now.
- This persistence model is suitable for local and single-instance deployments. Revisit it before moving to stateless or multi-instance infrastructure.

## Future

- Inbound CRM webhooks -> Payload
- Quotes -> CRM deals
- Optional write-back from CRM deal stage to Payload quote status
- Decide whether runtime provider state should stay file-based or move into Payload once schema work is approved

## Planned quote-to-deal sync shape

1. **Payload quote stays the source of truth** for scope, pricing, tax notes, and internal job detail.
2. **The active CRM deal mirrors the quote** for owner assignment, follow-up tasks, stage management, and pipeline reporting.
3. **Payload stores the external deal id** so future updates can stay linked.
4. **Write-back is deferred** until one-way push is stable and stage mapping is defined.

## EngageBay vs HubSpot (working summary)

| Topic | EngageBay | HubSpot |
|-------|-----------|---------|
| Cost / SMB fit | Often favorable for all-in-one SMB | Higher tiers for full API/automation |
| API maturity | Good enough for current lead sync, but thinner | Stronger ecosystem and app model |
| Current repo posture | Default active provider | Fallback provider path ready |
