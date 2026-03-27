# Customer-facing site: routes, content, forms, and internal CRM flow

**Owner:** TBD  
**Last reviewed:** 2026-03-24

## What visitors see today

| URL | What it is |
|-----|------------|
| **`/`** | **Home** - a **Page** with slug `home` from the CMS, or a small fallback while the DB is empty. |
| **`/contact`**, **`/about`**, etc. | **Dynamic pages** rendered from the same frontend page template. |
| **`/privacy-policy`**, **`/terms-and-conditions`**, **`/refund-policy`**, **`/contact-sla`** | Public customer-support / trust pages seeded into the same **Pages** collection. |
| **`/schedule`** | Redirects to **`/#instant-quote`** (scheduling is optional on the home instant quote form). Legacy **`/api/lead-forms/schedule`** may still exist for older clients. |
| **`/admin`** | **Payload admin** (staff only) for Pages, Posts, Forms, Globals, Media, and internal records. |

## How to get a real marketing site

1. Run `npm run dev` and open `/admin`.
2. Seed if you want demo pages/posts/forms.
3. In **Pages**, open `home` or create it with slug `home`, then publish it.
4. Use the layout builder for hero/content/CTA blocks or the custom homepage surfaces already wired in code.
5. Update **Header** and **Footer** globals with real nav links.
6. Republish affected pages so the frontend revalidates.

## Forms (Payload -> internal CRM flow)

- **Form builder** still lives in Payload for layout-builder blocks, and those blocks POST to **`/api/form-submissions`**. Submissions are stored in the **`form-submissions`** collection (admin **Leads** group). Each row gets **`leadEmail`** / **`leadName`** from common field names and **`crmSyncStatus`** (+ timestamp/detail) during the server-side create path.
- **Current create-path behavior:** [`src/hooks/beforeFormSubmissionCrm.ts`](../../src/hooks/beforeFormSubmissionCrm.ts) and [`src/lib/crm`](../../src/lib/crm) now keep submissions internal while the first-party CRM model replaces third-party providers.
- **Field names (contact card):** system fields mapped are `email`, `name` / `fullName` / `firstName`, and `phone`. Everything else stays in Payload and should later feed internal activities / notes.
- **Scheduling (public):** Optional block on the home instant quote form posts to **`/api/lead-forms/instant-quote`** with extra rows when scheduling is requested; CRM treats `instant_quote` + `schedulingRequested: Yes` as **`scheduling_support`**. Standalone **`/schedule`** redirects to **`/#instant-quote`**. **`/api/lead-forms/schedule`** remains for legacy/testing.
- **Contact support path:** `/contact` is the non-quote catch-all and should cover general support, billing/refund, privacy, policy, scheduling, and service follow-up requests.
- **Contact page (CMS):** `pages` slug `contact` is rendered by [`src/app/(frontend)/[slug]/page.tsx`](../../src/app/(frontend)/[slug]/page.tsx). Layout uses the **Contact request (first-party)** block ([`src/blocks/ContactRequest/Component.tsx`](../../src/blocks/ContactRequest/Component.tsx)) so submissions use `/api/lead-forms/contact` and [`src/lib/forms/contactRequest.ts`](../../src/lib/forms/contactRequest.ts)—not a generic Form block. Edit hero copy and SEO on the `contact` page in Payload.

## Shared form system

- Shared React Hook Form + Zod UI helpers live in [`src/components/ui/form.tsx`](../../src/components/ui/form.tsx).
- Shared client submit helper lives in [`src/lib/forms/api.ts`](../../src/lib/forms/api.ts).
- Shared lead-validator helpers live in [`src/lib/forms/shared.ts`](../../src/lib/forms/shared.ts).
- Shared server-side form-submission helper lives in [`src/lib/forms/createLeadFormSubmission.ts`](../../src/lib/forms/createLeadFormSubmission.ts).
- Schedule request schema + row mapping live in [`src/lib/forms/scheduleRequest.ts`](../../src/lib/forms/scheduleRequest.ts).
- Contact request schema + row mapping live in [`src/lib/forms/contactRequest.ts`](../../src/lib/forms/contactRequest.ts).
- Instant quote schema + row mapping live in [`src/lib/forms/instantQuoteRequest.ts`](../../src/lib/forms/instantQuoteRequest.ts).

## Content checklist

- [x] Published **home** with real hero, services, trust, service area, and CTA.
- [x] Public pricing stays estimate-led through the instant quote estimator, not a homepage package table.
- [x] Shared visual system feels deliberate across public site, customer login, and admin login.
- [ ] Reviews / testimonials visible on the homepage and editable quickly in Payload admin.
- [x] Before / after proof or project-gallery content visible on at least one key landing page.
- [x] Contact page and schedule / quote flows reviewed on mobile.
- [x] `/contact` uses strong visual contrast (not faded), concise copy, and immediately clear primary action.
- [x] `/contact` request card includes Grime Time logo branding.
- [x] Long-form support/help text on `/contact` is presented with compact tabs + single detail panel, not scattered standalone cards.
- [x] Icon usage on `/contact` reinforces categories and actions without adding copy bloat.
- [x] Privacy, terms, refund, and contact-SLA pages reviewed on mobile and linked from the footer/contact flow.
- [x] Header nav + mobile menu reviewed.
- [ ] SEO titles/descriptions reviewed on key pages.
- [ ] Images in **Media** are real Grime Time assets, not stock placeholders.
- [ ] Confirm one test form submission appears in Payload with usable follow-up metadata.

## Current planning focus

The launch version should make trust and conversion obvious:

- strong hero with service + geography
- one primary CTA and one secondary CTA
- visible proof: reviews, testimonials, before/after work
- service areas and FAQs that remove friction
- quote, contact, and schedule paths that turn into internal lead records every time
- contact support UX that is scannable in under 10 seconds (what this is for, what to do next, and where policy details live)

## References

- [Payload layout template (with-vercel-website)](https://github.com/payloadcms/payload/tree/main/templates/with-vercel-website)
- Ops: [Lead to customer runbook](../../src/content/docs/lead-to-customer-runbook.md), [`crm-and-integrations.md`](./crm-and-integrations.md)
