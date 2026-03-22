# Customer-facing site: routes, content, forms, EngageBay

**Owner:** TBD  
**Last reviewed:** 2026-03-21  

## What visitors see today

| URL | What it is |
|-----|------------|
| **`/`** | **Home** — a **Page** with slug `home` from the CMS, **or** (until seeded / empty DB) a tiny fallback: [`home-static`](../../src/endpoints/seed/home-static.ts) (“Grime Time” + link to `/admin`). |
| **`/contact`**, **`/about`**, etc. | **Dynamic pages** — same template as home: [`[slug]/page.tsx`](../../src/app/(frontend)/[slug]/page.tsx). Slug = URL segment. |
| **`/posts`**, **`/posts/...`** | Blog-style **Posts** (after seed). |
| **`/schedule`** | EngageHub **scheduling embed** when `ENGAGEBAY_SCHEDULE_FORM_ID` is set. |
| **`/admin`** | **Payload admin** (staff only) — edit Pages, Posts, **Forms**, Globals (Header/Footer), Media. |

**Why it “just says Grime Time”:** the database has no published **home** page yet, or you haven’t re-seeded / edited content — so the app shows the **static fallback** for `/` only.

## How to get a real marketing site (happy path)

1. **`npm run dev`** (or production URL) and open **`/admin`**.  
2. **Seed** (dashboard button) if you want demo pages/posts/forms — *destructive* to seeded collections.  
3. In **Pages**, open **`home`** (or create it, slug **`home`**, publish).  
4. Use the **layout builder** (Hero, Content, Media, CTA, **Form** blocks) to design the landing page.  
5. **Globals** → **Header / Footer** — add nav links (`/`, `/schedule`, `/contact`, etc.).  
6. **Republish** affected pages so the front-end rebuilds (template uses revalidation hooks).

## Forms (Payload → EngageBay)

- **Form builder** lives in Payload; blocks on pages POST to **`/api/form-submissions`** (Payload). Submissions are stored in the **`form-submissions`** collection (admin **Leads** group). Each row gets **`leadEmail`** / **`leadName`** from common field names and **`crmSyncStatus`** (+ timestamp/detail) after the EngageBay step runs.  
- **EngageBay:** when `ENGAGEBAY_API_KEY` is set and sync is not disabled, each **new** submission creates/updates a **contact** via EngageBay’s REST API (`POST .../subscribers/subscriber`), then attaches a **note** with every submitted field (so `message` and custom fields show in CRM). Disable notes with `ENGAGEBAY_ATTACH_SUBMISSION_NOTE=false`. See [`engagebay/syncFormSubmissionToEngageBay.ts`](../../src/lib/engagebay/syncFormSubmissionToEngageBay.ts).  
- **Field names (contact card):** **SYSTEM** fields mapped: `email` (required), `name` / `fullName` / `firstName`, `phone`. Everything else is in the **note** body.  
- **Scheduling:** keep using **`/schedule`** + `EhForms` embed; optional **tag** `ENGAGEBAY_SUBMISSION_TAG` on API-created contacts for “website form” vs “scheduler”.

## Tracking & embeds (already in code)

- **`EngageBayTracking`** in [`layout.tsx`](../../src/app/(frontend)/layout.tsx): `ehform.js` + `set_account` from env.  
- **Schedule embed:** [`EngageBayScheduleForm`](../../src/components/EngageBayScheduleForm/).

## Content checklist (better-looking launch)

- [ ] Published **home** with real hero, services, trust, service area, CTA.  
- [ ] **Contact** page + Form block (or link to `/schedule`).  
- [ ] Header nav + mobile menu reviewed.  
- [ ] SEO titles/descriptions (SEO plugin fields on pages).  
- [ ] Images in **Media** (Supabase Storage bucket `media` when S3 env vars are set).  
- [ ] Confirm one test form submission appears in **EngageBay** contacts.

## References

- [Payload layout template (with-vercel-website)](https://github.com/payloadcms/payload/tree/main/templates/with-vercel-website)  
- [EngageBay REST API](https://github.com/engagebay/restapi)  
- Ops: [`lead-to-customer-runbook.md`](./lead-to-customer-runbook.md), [`crm-and-integrations.md`](./crm-and-integrations.md)  
