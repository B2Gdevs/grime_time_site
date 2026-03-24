# Workflow documentation (living)

**Roadmap / phase artifacts:** [`ROADMAP.xml`](../ROADMAP.xml) and [`../phases/README.md`](../phases/README.md) - do not add duplicate phase-bridge files under `workflows/`.

**Staff runbooks in the app:** Operational docs staff read in the product live in **`src/content/docs/`** and are registered in [`src/lib/docs/catalog.ts`](../../src/lib/docs/catalog.ts) with `audience: 'admin'`.

Suggested docs:

| Doc | Purpose |
|-----|---------|
| `internal-docs-policy.md` | Public repo rules, sensitive-content boundary, and internal tool guardrails |
| `crm-org-and-sync.md` | CRM organization model, mixed email domains, and sync patterns |
| `crm-and-integrations.md` | Integration map for Payload, EngageBay, Supabase, and environment variables |
| `business-scorecard-and-growth.md` | KPIs, MRR, asset ladder, operating rhythm, milestones, and tool recommendations |
| `engagebay-integration-review.md` | API, webhook, and launch checklist before production CRM cutover |
| `quote-system-and-texas-compliance.md` | Internal quotes, tax-process guidance, and pricing formulas |
| `customer-site-content-and-engagebay.md` | Public URLs, CMS workflow, forms-to-CRM flow, and content checklist |
| `team-login-and-vault.md` | Login, credential ownership, and rotation process |
| `admin-portal-quotes-ux.md` | Admin, portal, internal dashboard, and quote UX backlog |
| `content-and-seeding.md` | Seed content workflow, baseline content ownership, and reset path |
| `payload-mcp-and-editor-setup.md` | Payload MCP enablement, migration gate, and local Cursor/Codex setup |
| `site-integrations-and-launch-checklist.md` | Current launch checklist for Payload, EngageBay, Resend, and the customer quote flow |

Integration specs and policies stay here. Product backlog and UX planning also use `ROADMAP.xml` and `phases/`.

Start each doc with **owner**, **tools**, and **last reviewed** date where it helps.

Rule of thumb: process and playbooks can live in private git and admin-only tools; customer records belong in the CRM once integrations are active.
