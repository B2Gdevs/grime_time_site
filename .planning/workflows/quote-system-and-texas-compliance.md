# Internal quote system - product math & Texas compliance (planning)

**Owner:** TBD  
**Last reviewed:** 2026-03-24  
**Visibility:** **Internal only.** Feature-flagged; customers see public site + booking-style forms, **not** final quotes until you intentionally expose them later.

## Implementation (v1 - Payload admin)

- **Collection:** `quotes` (admin group **Internal**). Fields match the intake list below (title, status, customer fields, job size, surfaces, soiling, access notes, internal notes).
- **Portal shortcuts:** Admin `/ops` and the portal sidebar should point staff to **Quotes** and **Quote settings**, not to the public `/schedule` page.
- **Access:** Set `QUOTES_INTERNAL_ENABLED=true` and `QUOTES_INTERNAL_EMAILS` to a comma-separated list of staff emails (must match Payload user emails). When disabled or the list is empty, **no one** can read/create quotes in admin.
- **Code:** [`src/collections/Quotes`](../../src/collections/Quotes), [`src/utilities/quotesAccess.ts`](../../src/utilities/quotesAccess.ts).
- **Pricing controls:** The public instant quote math is powered by global [`src/globals/QuoteSettings/config.ts`](../../src/globals/QuoteSettings/config.ts), which has Payload drafts enabled so staff can stage and publish pricing/service changes deliberately.
- **Internal pipeline handoff:** Quote detail stays in Payload and should feed a first-party opportunity pipeline for follow-up and pipeline visibility. Current hook boundary: [`src/hooks/beforeQuoteCrm.ts`](../../src/hooks/beforeQuoteCrm.ts).

## Texas tax review snapshot (reviewed March 23, 2026)

Primary source check against the **Texas Comptroller** says the following is the current working default for this business:

- **Cleaning / janitorial services are taxable.** Comptroller publication **94-111** says if you operate a janitorial or custodial service, you should be collecting sales and use tax.
- **Exterior cleaning of buildings is taxable.** The same publication says tax is due on charges to clean a home, office, warehouse, garage, restaurant, or other building, including washing windows.
- **Pressure washing is generally taxable.** Comptroller publication **94-111** says pressure washing is taxable, and specifically notes that pressure washing buildings, sidewalks, and parking lots is taxable as building or grounds cleaning.
- **Typical operating inputs are taxable to you.** Publication **94-111** says you must pay tax on soap, cleaners, chemicals, materials, supplies, and equipment used to perform cleaning services, subject to limited resale-certificate situations for items transferred to the customer.
- **Residential exceptions are narrow.** Publication **94-111** says the self-employed household worker exception does **not** cover broader real property services like landscaping or pool cleaning; homebuilder / new residential construction treatment is separate and should be handled carefully.
- **New construction / contractor rules are different.** Publication **94-116** says new construction and certain residential contractor scenarios follow contractor rules instead of the normal taxable-service pattern, which is why quote records need an explicit exemption / review path.

Operational reading for Grime Time:

- Default most quote lines to **taxable**.
- Keep a **manual review** path for any homebuilder, new-residential-construction, exempt-organization, or unusual mixed contract scenario.
- Do **not** hardcode a universal rate table until the business decides how it wants to manage local tax collection and gets CPA confirmation on the exact service mix.

## Job intake fields (for quotes when built)

- **Property / job size** (sq ft, stories, linear feet, or structured presets)
- **Description** of surfaces (siding, concrete, roof, windows, etc.)
- **Soiling level** (for example light dust to heavily stained / oxidation) - drives labor hours multiplier
- **Access / hazards** notes (ladder work, vegetation, HOA) - optional risk/time adder
- **Photos** (future): stored in Payload media or blob; admin-only until published

## Economics (baseline formulas - tune with real data)

Use spreadsheet or internal admin calculators before automating in code.

| Concept | Formula / note |
|--------|----------------|
| **Labor cost** | `sum(crew_hours x loaded_hourly_rate)` - *loaded* = wages + payroll tax + workers' comp + benefits allocation |
| **Materials** | `consumables + equipment depreciation allocation` per job type |
| **Subtotal** | `labor + materials` |
| **Markup / margin** | Either `price = subtotal / (1 - target_margin)` or explicit markup % on subtotal |
| **Sales tax (Texas)** | Apply **Texas sales tax** only where taxable per **Texas Comptroller** rules for your service categories and nexus; some services may be non-taxable or partially taxable - **verify with a CPA** before encoding rates. |
| **Fees** | Separate line items (for example environmental, trip) if used; document each as pass-through vs revenue |

**Compliance:** This doc is not legal/tax advice. Maintain a **rate table** versioned by effective date when rules change.

## Forecasting & capacity (management views)

| Metric | Definition / question |
|--------|------------------------|
| **Conversion rate** | `% of contacts who became paying customers` over a window |
| **Repeat rate** | `% customers with >1 job` or average jobs per customer per year |
| **Pipeline** | Weighted value of open quotes / opportunities |
| **Monthly recurring revenue (approx)** | For subscription/maintenance plans if offered; else use **projected booked revenue** from calendar |
| **Capacity** | `available crew_hours/month - booked_hours`; when utilization > X% sustained, flag **hire** |

**"What if" scenarios:** Model `new_leads_per_month x conversion x average_ticket` vs `max_jobs_per_month` from crew capacity.

## Staffing heuristic (example - replace with your numbers)

- `accounts_per_coordinator = max_active_relationships` (for example follow-ups + active jobs)
- If `active_accounts > N x coordinators`, review hire or automation (Payload jobs, Resend sequences, templates)

## Feature flags & access

- Env allowlist: `QUOTES_INTERNAL_EMAILS` (see `.env.example`); only those Payload users may access quote admin surfaces.
- `QUOTES_INTERNAL_ENABLED=false` until routes/UI ship.
- Never expose draft quotes on public routes; SEO `noindex` any accidental preview URLs.

## Next planning steps

- [ ] CPA confirmation on Texas tax treatment per service line
- [x] Lock v1 field list and status workflow (draft -> sent -> accepted/lost) - reflected in Payload `quotes` collection
- [x] Keep Payload as quote source of truth and plan a first-party opportunity pipeline
- [x] Optional: link `quotes` -> `form-submissions` - **sourceSubmission** relationship on `quotes`
- [x] Keep lifecycle metadata on quotes while the first-party opportunity model is being defined
- [ ] Define which quote events create/update an internal opportunity (`sent`, `accepted`, `lost`)
- [ ] Define internal opportunity stage mapping and owner rules
