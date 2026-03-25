# Ops dashboard targets

The **Internal ops targets** global in Payload admin drives values and copy on the internal **`/ops`** dashboard:

- **Projected revenue** and **MRR** KPI card fallback values when live first-party records do not yet provide a stronger number.
- **KPI tooltips** per-card help text shown on the info icon next to Leads, Quotes, Projected revenue, and MRR.
- **Scorecard KPI tooltips** rows keyed by KPI **name** and shown in the scorecard tab while formulas stay in code.
- **Chart disclaimer** text under the business momentum chart while the chart series remains illustrative.
- **Chart pipeline note** optional extra line merged into the disclaimer when you want to explain how the internal weighted quote pipeline is being calculated.
- **Annual revenue goal** reference number for planning.

## What powers `/ops`

- **Leads** come from Payload `form-submissions`.
- **Quotes** come from Payload `quotes`.
- **Projected revenue** should come from internal quote pipeline math first, then scorecard/manual fallback values when there is not enough live quote data yet.
- **MRR** should come from active Payload `service-plans` first, then scorecard/manual fallback values when service-plan data is not ready.
- **Day plan** comes from Payload `service-appointments`.

## Growth and asset ladders

Milestones and asset ladder rows are **Payload collections** (admin-only):

- **Growth milestones** -> Internal -> Growth milestones.
- **Ops asset ladder items** -> Internal -> Ops asset ladder items.

## Liabilities and scorecard rows

- **Ops liability items** (`ops-liability-items`) drive the scorecard tab liabilities list on `/ops`.
- **Ops scorecard rows** (`ops-scorecard-rows`) define formula text, target guidance, optional manual values, and sort order. The dashboard merges these with code defaults from `businessOperatingSystem` so the live dashboard uses the CRUD data instead of treating it as admin-only decoration.

## Admin vs customer dashboard

- Admins use **Ops dashboard** (`/ops`) for the internal command center.
- The sidebar also exposes **Customer home** (`/dashboard`) so admins can preview the customer dashboard without losing access to `/ops`.

## Staff-only portal (optional)

Set **`PORTAL_ADMIN_ONLY=true`** in the server environment (see `.env.example`). Non-admin portal users are redirected off `(portal)` routes.

## Where to edit

1. Sign in to **Payload admin** as an **admin** user.
2. Open **Globals -> Internal ops targets** (group **Internal**), or the collections above.
3. Run **`npm run payload migrate`** after deployments that include new migrations, then refresh **`/ops`**.

If the global row is missing or migrations are not applied, the dashboard falls back to built-in defaults and logs a warning on the server.
