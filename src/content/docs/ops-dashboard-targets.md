# Ops dashboard targets

The **Internal ops targets** global in Payload admin drives values and copy on the internal **`/ops`** dashboard:

- **Projected revenue** and **MRR** KPI card values (display strings when HubSpot is not supplying live pipeline data, e.g. `$13.6k`).
- **KPI tooltips** — per-card help text shown on the info icon next to Leads, Quotes, Projected revenue, and MRR.
- **Scorecard KPI tooltips** — rows keyed by KPI **name** (must match the scorecard label exactly, e.g. `Revenue`, `MRR`). Shown in the scorecard tab; full formulas remain in code behind the same info control.
- **Chart disclaimer** — text under the business momentum chart (the chart series remains **illustrative** until real time series exist).
- **Chart pipeline note** — optional extra line merged into the disclaimer when you want to document how HubSpot pipeline numbers are computed.
- **Annual revenue goal** — reference number for planning (not yet wired to the chart).

## HubSpot vs EngageBay on `/ops`

- **Form submission sync** still follows whichever provider is active (existing CRM abstraction).
- **CRM tasks by day** and **open-deal pipeline total** for the projected revenue card are loaded from **HubSpot only** when HubSpot is the active provider and `HUBSPOT_ACCESS_TOKEN` or `HUBSPOT_PRIVATE_APP_TOKEN` is set. If EngageBay is active, the calendar shows a short note to switch providers; a banner at the top explains this (see **D-crm-003** in `.planning/DECISIONS.xml`).
- Pipeline v1 sums **amount** on **open** deals from a HubSpot search capped at **100** deals — not stage-probability weighted.

## Growth and asset ladders

Milestones and asset ladder rows are **Payload collections** (admin-only):

- **Growth milestones** — Internal → Growth milestones.
- **Ops asset ladder items** — Internal → Ops asset ladder items (`owned`: unchecked = want, checked = have).

## Liabilities and scorecard rows

- **Ops liability items** (`ops-liability-items`) — checklist shown under the scorecard tab’s **Liabilities** sub-tab on `/ops`. If the collection is empty, the UI can fall back to built-in defaults until you add rows in admin.
- **Ops scorecard rows** (`ops-scorecard-rows`) — per-row title, formula text, target guidance, optional manual value fields, and sort order. The portal **merges** these with code defaults from `businessOperatingSystem` so you can start with partial overrides.

The `/ops` scorecard area includes links to manage these collections in Payload admin.

## Admin vs customer dashboard

- Admins use **Ops dashboard** (`/ops`) for the internal command center.
- The sidebar also exposes **Customer home** (`/dashboard`) so admins can preview the customer dashboard without losing access to `/ops`.

## Staff-only portal (optional)

Set **`PORTAL_ADMIN_ONLY=true`** in the server environment (see `.env.example`). Non-admin portal users are redirected off `(portal)` routes; use when you want internal staff testing only.

## Where to edit

1. Sign in to **Payload admin** as an **admin** user.
2. Open **Globals → Internal ops targets** (group **Internal**), or the collections above.
3. Run **`npm run payload migrate`** after deployments that include new migrations, then refresh **`/ops`**.

If the global row is missing or migrations are not applied, the dashboard falls back to built-in defaults and logs a warning on the server.

## Sync banner troubleshooting

| Banner | Meaning |
|--------|---------|
| CRM day board uses HubSpot | EngageBay (or non-HubSpot) is active — switch the CRM toggle to HubSpot for tasks/pipeline. |
| HubSpot token missing | Set `HUBSPOT_ACCESS_TOKEN` or `HUBSPOT_PRIVATE_APP_TOKEN` on the server and redeploy. |
| HubSpot sync error | Token present but API rejected the call — check scopes and HubSpot account status. |
| HubSpot data partial | Health check passed but pipeline or another read failed — message includes the API error snippet. |
