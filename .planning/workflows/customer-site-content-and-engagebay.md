# Customer-facing site: routes, content, forms, CRM

**Owner:** TBD  
**Last reviewed:** 2026-03-24  

## What visitors see today

| URL | What it is |
|-----|------------|
| **`/`** | **Home** - a **Page** with slug `home` from the CMS, or a small fallback while the DB is empty. |
| **`/contact`**, **`/about`**, etc. | **Dynamic pages** rendered from the same frontend page template. |
| **`/posts`**, **`/posts/...`** | Blog-style **Posts**. |
| **`/schedule`** | First-party **schedule request form** built in React. It stores a Payload form submission and writes into the active CRM provider from the server-side create path. |
| **`/admin`** | **Payload admin** (staff only) for Pages, Posts, Forms, Globals, Media, and internal records. |

## How to get a real marketing site

1. Run `npm run dev` and open `/admin`.
2. Seed if you want demo pages/posts/forms.
3. In **Pages**, open `home` or create it with slug `home`, then publish it.
4. Use the layout builder for hero/content/CTA blocks or the custom homepage surfaces already wired in code.
5. Update **Header** and **Footer** globals with real nav links.
6. Republish affected pages so the frontend revalidates.

## Forms (Payload -> CRM)

- **Form builder** still lives in Payload for layout-builder blocks, and those blocks POST to **`/api/form-submissions`**. Submissions are stored in the **`form-submissions`** collection (admin **Leads** group). Each row gets **`leadEmail`** / **`leadName`** from common field names and **`crmSyncStatus`** (+ timestamp/detail) during the server-side create path.
- **CRM provider abstraction:** the create path now routes through [`src/hooks/beforeFormSubmissionCrm.ts`](../../src/hooks/beforeFormSubmissionCrm.ts) and [`src/lib/crm`](../../src/lib/crm). EngageBay is the default provider when configured; HubSpot is supported as a fallback. Admins can switch the active provider from `/ops` without schema changes.
- **EngageBay today:** when `ENGAGEBAY_API_KEY` is set and sync is not disabled, each new submission creates or updates a contact through EngageBay's REST API and attempts to attach a note with every submitted field. Disable notes with `ENGAGEBAY_ATTACH_SUBMISSION_NOTE=false`.
- **Field names (contact card):** system fields mapped are `email`, `name` / `fullName` / `firstName`, and `phone`. Everything else is carried in the CRM note or activity body where supported.
- **Scheduling:** `/schedule` now uses a native form and posts to `/api/lead-forms/schedule`. The form-submission create path sets `crmSyncStatus` / `crmSyncedAt` / `crmSyncDetail` while it writes to the active CRM provider.

## Shared form system

- Shared React Hook Form + Zod UI helpers live in [`src/components/ui/form.tsx`](../../src/components/ui/form.tsx).
- Shared client submit helper lives in [`src/lib/forms/api.ts`](../../src/lib/forms/api.ts).
- Shared lead-validator helpers live in [`src/lib/forms/shared.ts`](../../src/lib/forms/shared.ts).
- Shared server-side form-submission helper lives in [`src/lib/forms/createLeadFormSubmission.ts`](../../src/lib/forms/createLeadFormSubmission.ts).
- Schedule request schema + row mapping live in [`src/lib/forms/scheduleRequest.ts`](../../src/lib/forms/scheduleRequest.ts).
- Contact request schema + row mapping live in [`src/lib/forms/contactRequest.ts`](../../src/lib/forms/contactRequest.ts).
- Instant quote schema + row mapping live in [`src/lib/forms/instantQuoteRequest.ts`](../../src/lib/forms/instantQuoteRequest.ts).

## Content checklist

- [ ] Published **home** with real hero, services, trust, service area, and CTA.
- [ ] Shared visual system feels deliberate across public site, customer login, and admin login.
- [ ] Reviews / testimonials visible on the homepage and editable quickly in Payload admin.
- [ ] Before / after proof or project-gallery content visible on at least one key landing page.
- [ ] Contact page and schedule / quote flows reviewed on mobile.
- [ ] Header nav + mobile menu reviewed.
- [ ] SEO titles/descriptions reviewed on key pages.
- [ ] Images in **Media** are real Grime Time assets, not stock placeholders.
- [ ] Confirm one test form submission appears in the active CRM provider.
- [ ] Confirm the current EngageBay API key is not over quota if EngageBay is active.

## Current planning focus

The launch version should make trust and conversion obvious:

- strong hero with service + geography
- one primary CTA and one secondary CTA
- visible proof: reviews, testimonials, before/after work
- service areas and FAQs that remove friction
- quote, contact, and schedule paths that turn into CRM contacts every time

## References

- [Payload layout template (with-vercel-website)](https://github.com/payloadcms/payload/tree/main/templates/with-vercel-website)
- [EngageBay REST API](https://github.com/engagebay/restapi)
- Ops: [Lead to customer runbook](../../src/content/docs/lead-to-customer-runbook.md), [`crm-and-integrations.md`](./crm-and-integrations.md)
