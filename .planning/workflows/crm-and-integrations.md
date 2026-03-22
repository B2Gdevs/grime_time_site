# CRM & integrations map (Grime Time)

**Owner:** TBD  
**Last reviewed:** 2026-03-21  
**CRM choice:** EngageBay (see [`DECISIONS.xml`](../DECISIONS.xml), [`crm-org-and-sync.md`](./crm-org-and-sync.md)).

## Single pane of glass (where things live)

| Data / action | Source of truth | How it gets there |
|---------------|-----------------|-------------------|
| Page copy, SEO, layout | **Payload** (`pages`, globals) | Admin UI |
| Uploaded images/files | **Supabase Storage** (`media` bucket) + Payload `media` docs | Admin upload; S3 env in `.env.example` |
| Form submission archive | **Payload** `form-submissions` (admin **Leads** group: `leadEmail`, `leadName`, `crmSyncStatus`, …) | Public form POST |
| Lead contact (email/name/phone) | **EngageBay** contact | Hook: `afterFormSubmissionEngageBay` → REST `POST .../subscribers/subscriber` |
| Full form text (message, extras) | **EngageBay** note on contact | Same hook → `POST .../notes` (disable with `ENGAGEBAY_ATTACH_SUBMISSION_NOTE=false`) |
| Internal quote drafts | **Payload** `quotes` | Admin only; `QUOTES_INTERNAL_ENABLED` + `QUOTES_INTERNAL_EMAILS` |
| Booking / scheduler UX | **EngageHub** (EngageBay) | `/schedule` embed |

## Environment variables (reference)

See **`.env.example`** for authoritative list. Integration-related:

- **EngageBay REST:** `ENGAGEBAY_API_KEY`, `ENGAGEBAY_SYNC_FORM_SUBMISSIONS`, `ENGAGEBAY_SUBMISSION_TAG`, `ENGAGEBAY_ATTACH_SUBMISSION_NOTE`
- **EngageBay client:** `ENGAGEBAY_JS_TRACKING_KEY`, `ENGAGEBAY_JS_FORM_REF`, `ENGAGEBAY_SCHEDULE_FORM_ID`
- **Quotes:** `QUOTES_INTERNAL_ENABLED`, `QUOTES_INTERNAL_EMAILS`
- **Supabase media:** `SUPABASE_URL`, `SUPABASE_S3_*`, `SUPABASE_STORAGE_BUCKET`

## Code touchpoints

| Area | Path |
|------|------|
| Form → EngageBay | [`src/hooks/afterFormSubmissionEngageBay.ts`](../../src/hooks/afterFormSubmissionEngageBay.ts), [`src/lib/engagebay/syncFormSubmissionToEngageBay.ts`](../../src/lib/engagebay/syncFormSubmissionToEngageBay.ts), CRM columns patch [`src/lib/formSubmissions/patchCrmMetadata.ts`](../../src/lib/formSubmissions/patchCrmMetadata.ts), lead extract [`src/utilities/formSubmissionLead.ts`](../../src/utilities/formSubmissionLead.ts) |
| Tracking + schedule UI | [`src/components/EngageBayTracking`](../../src/components/EngageBayTracking), [`src/components/EngageBayScheduleForm`](../../src/components/EngageBayScheduleForm) |
| Quotes access | [`src/utilities/quotesAccess.ts`](../../src/utilities/quotesAccess.ts), [`src/collections/Quotes`](../../src/collections/Quotes) |

## Future (not built yet)

- EngageBay **webhooks** inbound → Payload (e.g. deal stage sync) — design per [`engagebay-integration-review.md`](./engagebay-integration-review.md)
- **Deals** created from Quotes or form rules
- HubSpot fallback if EngageBay API limits block automation

## EngageBay vs HubSpot (summary)

| Topic | EngageBay | HubSpot |
|-------|-----------|---------|
| Cost / SMB fit | Often favorable for all-in-one SMB | Higher tiers for full API/automation |
| API | REST documented on GitHub `engagebay/restapi`; verify in trial | Mature REST + large ecosystem |
| Risk | Niche API churn vs HubSpot | Cost / complexity |

*Detailed comparison was a planning task (TASK-REGISTRY `02-02`); this table is the working summary.*
