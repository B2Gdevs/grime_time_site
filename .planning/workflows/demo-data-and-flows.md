# Demo data and scripted flows (launch readiness)

**Owner:** TBD  
**Last reviewed:** 2026-03-27

## Demo personas (Option A locked)

**Auth:** all eight use `@demo.grimetime.app` and shared password `changethis`. **Outbound / transactional customer email** on seeded invoices, quotes, and leads uses **`b2gdevs@gmail.com`** via `customerEmail` (and the same pattern elsewhere) until per-user notification preferences or distribution lists exist.

**Accounts (3):**

| Account | CRM type | Purpose |
|--------|----------|---------|
| Chen household | `residential` | Subscription + history; **refund/dispute dry-run** on Jordan |
| Sunset Ridge HOA | `hoa_multifamily` | HOA / multifamily (not the same as commercial) |
| Lakeside Retail Group | `commercial` | Storefront / ops / billing split across users |

**Portal users (8) source of truth:** `src/endpoints/seed/demo-personas.ts`

| Person | Email | Account |
|--------|--------|---------|
| Jordan Chen | `jordan.chen@demo.grimetime.app` | Chen household - primary; refund storyline |
| Sam Chen | `sam.chen@demo.grimetime.app` | Chen household |
| Alex Kim | `alex.kim@demo.grimetime.app` | Chen household |
| Morgan Park | `morgan.park@demo.grimetime.app` | Sunset Ridge HOA |
| Riley Torres | `riley.torres@demo.grimetime.app` | Sunset Ridge HOA |
| Casey Nguyen | `casey.nguyen@demo.grimetime.app` | Lakeside Retail |
| Drew Okonkwo | `drew.okonkwo@demo.grimetime.app` | Lakeside Retail |
| Jamie Patel | `jamie.patel@demo.grimetime.app` | Lakeside Retail |

**CRM ownership:** Seed assigns **owners round-robin** across staff (`QUOTES_INTERNAL_EMAILS` / `bg@`, `pb@`, `de@` on `grimetime.app`). **Opportunities** use normal titles from context (quote + account); no separate hero-deal naming is required.

## Purpose

Define the **minimum believable dataset** and **click-path scripts** needed to demo the business end-to-end (staff + customer) without improvising in the admin UI. This feeds seed work, manual fixtures, and launch QA.

## Environment note

Confirm **`POSTGRES_URL`** points at your intended database (e.g. Supabase) in each environment so demos match production behavior.

## Target scenarios (v1 checklist)

Work through these in order; tick when data exists and the path is verified on **mobile** and desktop.

1. **Residential - completed service**  
   Customer with a past job, readable history in portal (appointments/invoices as applicable).

2. **Residential - active subscription / recurring plan**  
   Shows plan state and next service context without breaking ops queues.

3. **Lead - just submitted via instant quote**  
   New `lead` from quote flow; appears in CRM/ops queues with correct source and follow-up metadata.

4. **Support / contact**  
   Contact request via first-party form to lead/activity path; staff can see and resolve from `/ops` or CRM surfaces.

5. **Refund / billing dispute (dry-run)**  
   Documented steps: where staff records outcome, how customer is notified, what **not** to do in admin for routine work.

6. **Staff day-to-day**  
   Primary navigation from **`/portal`** and **`/ops`**; Payload **`/admin`** only for content/config fixes.

## Customer vs staff login

- **Customers:** `/login` to customer account (estimates, invoices, scheduling as enabled).  
- **Staff:** **`/admin`** for Payload CMS; team app at **`/portal`** and **`/ops`** after staff authentication (see login page copy).

## Portal tours (Joyride)

- **Registry:** `src/lib/tours/registry.ts` - each tour has `audience: staff | customer`. Staff: `ops-dashboard` (overview; optional session autolaunch for real admins), `staff-crm-workspace`, `staff-today-board`, `staff-scorecard-liabilities`, `staff-assets-ladder`, `staff-milestones`, `staff-portal-docs`. Customer: `customer-dashboard`, `customer-estimates`, `customer-invoices`, `customer-schedule`, `customer-account`. URL `?tour=` must match an ID; `/ops` deep links use `?tab=` as needed.  
- **Marketing site:** `src/lib/tours/site-registry.ts` - `public-instant-quote` on `/` only; **Quick tour** and Joyride run only when **demo mode** is on (`?demo=1` sets cookie, or toggle from dev). Wired in `SiteTourProvider` (`src/app/(frontend)/layout.tsx`).  
- **Completion:** `src/lib/tours/storage.ts` - localStorage marks tours seen after finish/skipped/error so autolaunch does not repeat forever.  
- **Launcher:** Sidebar "Guided tours" - grouped **Customer** vs **Staff / field team**; hidden unless tours are enabled (demo persona login or admin with demo mode).  
- **Demo mode:** `src/providers/DemoModeProvider.tsx` - cookie `grime_demo_mode`; admin toolbar **Demo data on/off** scopes `/ops` + CRM API to `@demo.grimetime.app` accounts; `src/lib/demo/tourAccess.ts` gates Joyride.  
- **Demo QA:** When changing layouts, re-run tours (DECISIONS `D-tour-001`). Seed: `npm run seed` includes `src/endpoints/seed/demo-seed.ts` by default; use `npm run seed:baseline` or `SEED_SKIP_DEMO=true` to skip demo fixtures.  
- **Out of scope:** Payload admin shortcuts tour. **AI** assistant tour waits on phase `08` (`.planning/BLOCKERS.xml` `BLK-tour-ai-001`).

## Next steps

- Link Resend/Stripe test behavior where relevant.  
- Add Playwright smoke tests when flows stabilize.

## References

- `src/endpoints/seed/index.ts` - seed entry points  
- `src/endpoints/seed/demo-personas.ts` - locked cast + notification email constant  
- `.planning/DECISIONS.xml` - `D-demo-001`, `D-tour-001`  
- `.planning/BLOCKERS.xml` - demo-seed and deferred AI tour gates  
- `.planning/workflows/customer-site-content-and-engagebay.md` - public forms  
