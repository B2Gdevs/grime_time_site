# Internal quote system — product math & Texas compliance (planning)

**Owner:** TBD  
**Last reviewed:** 2026-03-20  
**Visibility:** **Internal only.** Feature-flagged; customers see public site + booking-style forms, **not** final quotes until you intentionally expose them later.

## Job intake fields (for quotes when built)

- **Property / job size** (sq ft, stories, linear feet, or structured presets)
- **Description** of surfaces (siding, concrete, roof, windows, etc.)
- **Soiling level** (e.g. light dust → heavily stained / oxidation) — drives labor hours multiplier
- **Access / hazards** notes (ladder work, vegetation, HOA) — optional risk/time adder
- **Photos** (future): stored in Payload media or blob; admin-only until published

## Economics (baseline formulas — tune with real data)

Use spreadsheet or internal admin calculators before automating in code.

| Concept | Formula / note |
|--------|----------------|
| **Labor cost** | `sum(crew_hours × loaded_hourly_rate)` — *loaded* = wages + payroll tax + workers’ comp + benefits allocation |
| **Materials** | `consumables + equipment depreciation allocation` per job type |
| **Subtotal** | `labor + materials` |
| **Markup / margin** | Either `price = subtotal / (1 - target_margin)` or explicit markup % on subtotal |
| **Sales tax (Texas)** | Apply **Texas sales tax** only where taxable per **Texas Comptroller** rules for your service categories and nexus; some services may be non-taxable or partially taxable — **verify with a CPA** before encoding rates. |
| **Fees** | Separate line items (e.g. environmental, trip) if used; document each as pass-through vs revenue |

**Compliance:** This doc is not legal/tax advice. Maintain a **rate table** versioned by effective date when rules change.

## Forecasting & capacity (management views)

| Metric | Definition / question |
|--------|------------------------|
| **Conversion rate** | `% of contacts who became paying customers` over a window |
| **Repeat rate** | `% customers with &gt;1 job` or average jobs per customer per year |
| **Pipeline** | Weighted value of open quotes/deals |
| **Monthly recurring revenue (approx)** | For subscription/maintenance plans if offered; else use **projected booked revenue** from calendar |
| **Capacity** | `available crew_hours/month − booked_hours`; when utilization &gt; X% sustained, flag **hire** |

**“What if” scenarios:** Model `new_leads_per_month × conversion × average_ticket` vs `max_jobs_per_month` from crew capacity.

## Staffing heuristic (example — replace with your numbers)

- `accounts_per_coordinator = max_active_relationships` (e.g. follow-ups + active jobs)
- If `active_accounts &gt; N × coordinators`, review hire or automation (EngageBay sequences, templates)

## Feature flags & access

- Env allowlist: `QUOTES_INTERNAL_EMAILS` (see `.env.example`); only those Payload users may access quote admin surfaces.
- `QUOTES_INTERNAL_ENABLED=false` until routes/UI ship.
- Never expose draft quotes on public routes; SEO `noindex` any accidental preview URLs.

## Next planning steps

- [ ] CPA confirmation on Texas tax treatment per service line
- [ ] Lock v1 field list and status workflow (draft → sent → accepted/lost)
- [ ] Decide if quotes are Payload-only with EngageBay deal sync or deal-only in CRM
