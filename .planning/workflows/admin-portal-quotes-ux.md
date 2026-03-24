# Admin, customer portal, dashboard, and quotes - UX principles and backlog

**Owner:** Product / ops (with dev for implementation)  
**Tools:** Payload admin (`/admin`), portal (`/login`, `/dashboard`, `/docs`, `/schedule`), internal **Quotes** collection  
**Last reviewed:** 2026-03-23

**Where this lives:** Product and UX backlog. Use with [`ROADMAP.xml`](../ROADMAP.xml) and [`../phases/`](../phases/). Operational runbook: [Lead to customer](../../src/content/docs/lead-to-customer-runbook.md) (Portal **Docs**, admin only).

## Planning anchors

- **Roadmap phase:** `06` - Quoting and advanced ops
- **Task registry:** `06-02` internal dashboard command center, `06-03` scorecard and growth data, `06-04` editable ops global later
- **Decisions:** `D-quotes-001`, `D-ops-001`

## North star

**Staff** should open one familiar place, find the next action in seconds, and rarely need a cheat sheet.  
**Customers** should understand what the portal is for, trust it, and complete next steps without calling unless they want to.

This doc is planning only. Implementation is tracked in code plus the linked phase and workflow artifacts.

## Three surfaces

| Surface | Primary users | Role |
|--------|----------------|------|
| **Marketing site** | Everyone | Book, contact, trust-building copy |
| **Portal** (`/dashboard`, `/docs`, ...) | Logged-in **customers** and **staff** | Lightweight hub for next steps, docs, schedule, and internal command-center views |
| **Payload admin** | **Admins** | Content, media, forms, Leads, Internal -> Quotes |
| **Quotes** | Allowlisted staff only | Internal job math and compliance record |

**Rule:** Customers never need `/admin`. Staff may use both portal and admin, but the portal should be the front door and Payload admin should be the deep-management layer.

## Internal dashboard UX

The internal dashboard is not a second CMS and not a generic analytics demo. It is the team's **command center**.

### What staff should see first

- KPI cards for leads, quotes, projected revenue, and MRR
- One chart that answers what is moving right now: pipeline, revenue, MRR, or margin
- One operator panel with direct links to scorecard docs, quote playbook, scheduling, and Payload admin
- One tabbed command area for:
  - **Today**: daily operating board and weekly/monthly rhythm
  - **Scorecard**: KPI definitions and liabilities
  - **Milestones**: growth ladder and current coaching
  - **Assets**: equipment ladder and software recommendations

### Dashboard success test

The dashboard should answer these in under 10 seconds:

1. What needs attention today?
2. What numbers matter this week?
3. What should we buy or unlock next?

### Current implementation anchors

- [`src/app/(portal)/dashboard/page.tsx`](../../src/app/(portal)/dashboard/page.tsx)
- [`src/components/chart-area-interactive.tsx`](../../src/components/chart-area-interactive.tsx)
- [`src/components/data-table.tsx`](../../src/components/data-table.tsx)
- [`src/lib/ops/businessOperatingSystem.ts`](../../src/lib/ops/businessOperatingSystem.ts)
- [`src/lib/ops/internalDashboardData.ts`](../../src/lib/ops/internalDashboardData.ts)

## UX principles

1. **Plain language** - Use labels the team actually uses: Lead, Quote, Schedule, Scorecard.
2. **One obvious next step** - Every dashboard section should imply an action, not just a fact.
3. **Forgiving paths** - If a user hits a dead end, link them to docs, contact, schedule, or admin.
4. **Consistent chrome** - Sidebar and headers should feel like one product across portal views.
5. **Progressive disclosure** - Keep compliance detail in quotes and docs, not in every summary card.
6. **Fast feedback** - Success and failure should be obvious when saves or sync actions are added later.

## Backlog

### A. Internal dashboard

- [x] Command-center shell for staff dashboard
- [x] KPI cards, business chart, operator panel, and command tabs
- [ ] Replace placeholder projected revenue and MRR targets with real business targets and documented formulas
- [ ] Add strong empty states when the business has no activity yet
- [ ] Test mobile and small-screen behavior for tabs, sidebar, and operator panel
- [ ] Move thresholds and targets into editable Payload data after migration approval

### B. Portal

- [ ] First-login clarity for customers and staff
- [ ] Keep admin-only links visually distinct so customers do not chase them
- [ ] Keep a permanent "What is this portal?" help entry

### C. Payload admin

- [ ] Group and label audit for Leads, Internal, Media, and Quotes
- [ ] Keep quote columns and field order aligned with the quote workflow doc
- [ ] Keep training and demo data realistic through seed content
- [ ] Provide a fast editing path for reviews, testimonials, and proof content
- [ ] Optional deep link from a form submission to create a quote

### D. Quote system

- [ ] Clear status workflow in list filters and badges
- [ ] Duplicate or template path for similar jobs
- [ ] Sync quote summaries into EngageBay deals for relationship management
- [ ] Future customer-visible quote flow in a separate doc before shipping anything public

### E. Cross-cutting

- [ ] Document single sign-on and account expectations in one place
- [ ] Portal/site error pages should route people back to contact or schedule
- [ ] Accessibility pass on portal nav, tabs, and custom components

## When this doc changes

Update **Last reviewed** when a major dashboard, portal, or quote UX slice ships. Keep tax math in [`quote-system-and-texas-compliance.md`](./quote-system-and-texas-compliance.md) and growth logic in [`business-scorecard-and-growth.md`](./business-scorecard-and-growth.md).
