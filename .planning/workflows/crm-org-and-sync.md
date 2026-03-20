# CRM: one org, shared management, mixed email domains

**Owner:** TBD  
**Last reviewed:** 2026-03-20  

## One org, one CRM account

**Goal:** Everyone who works Grime Time leads and customers should be in the **same CRM account** (one subscription / tenant), with roles (admin, sales, ops)—not separate personal CRMs.

**Mixed email domains:** This is normal. CRMs (HubSpot, EngageBay, Salesforce, etc.) invite users by **email address**. The address does **not** need to match your company domain. You can invite:

- `name@gmail.com`
- `name@outlook.com`
- `you@grimetime.com` (when you have one)

They all join the **same account** when you invite them from that account’s admin/settings. The “org” is the **CRM tenant**, not your email domain.

**Practical steps (any CRM):**

1. Create **one** CRM account for the business (owner billing or designated admin).  
2. **Invite** teammates via **Settings → Users & permissions** (wording varies).  
3. Assign **roles** (e.g. super admin vs marketing vs sales) so people only see what they need.  
4. Optionally add **SSO** later (often Business/Enterprise tiers); not required for mixed domains.

## Connecting the website + “manage everything”

**Principle:** Pick **one system of record per entity** to avoid endless conflicts.

| Entity | Typical source of truth | Notes |
|--------|-------------------------|--------|
| **Marketing site content** | Payload | Pages, layout, SEO |
| **Contacts / leads / pipeline** | CRM (recommended) | After a short list, sync from site or CRM |
| **Email sequences / deals** | CRM | Use CRM’s native tools |

**Patterns:**

1. **CRM-first leads:** New form submissions → API/webhook/Zapier/Make → **create/update contact** in CRM; Payload stores only a copy or ID if needed.  
2. **Payload-first:** Store lead in Payload → **job** or **server** pushes to CRM via API.  
3. **Bidirectional** (harder): Only when you need it; start one-way then expand.

**EngageBay vs HubSpot** (comparison for *your* decision):

- **HubSpot:** Strong ecosystem, free tier limits, clear API; good if you outgrow simple marketing.  
- **EngageBay:** Often cheaper for SMB all-in-one; verify API and webhook depth for your automations.  

Document the chosen CRM’s **API keys** in env vars (never in git); map fields (email, phone, source, UTM) once.

## Alignment with Payload

- **Staff** log into Payload Admin for content; **same people** may also log into CRM for pipeline—two tools, one **process** doc (who owns what).  
- Long-term: **embed** CRM views or deep links from an internal Payload dashboard (optional) so the “one place to start” feels unified even if data lives in CRM.

## Open items

- [ ] Pick CRM (narrow D-crm-001 in DECISIONS.xml).  
- [ ] Define field mapping: form → CRM contact.  
- [ ] Confirm whether any lead data stays in Payload or is CRM-only after sync.
