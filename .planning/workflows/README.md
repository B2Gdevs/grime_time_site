# Workflow documentation (living)

**Roadmap / phase artifacts:** [`ROADMAP.xml`](../ROADMAP.xml) and [`../phases/README.md`](../phases/README.md) - do not add duplicate phase-bridge files under `workflows/`.

**Staff runbooks in the app:** Operational docs staff read in the product live in **`src/content/docs/`** and are registered in [`src/lib/docs/catalog.ts`](../../src/lib/docs/catalog.ts) with `audience: 'admin'`.

Suggested docs:

| Doc | Purpose |
|-----|---------|
| `internal-docs-policy.md` | Public repo rules, sensitive-content boundary, and internal tool guardrails |
| `crm-org-and-sync.md` | Historical CRM organization notes; keep aligned with the first-party CRM direction if reused |
| `crm-and-integrations.md` | Integration map for Payload, Stripe, Resend, Supabase, and internal CRM boundaries |
| `field-agent-messaging-and-notifications.md` | Quote-notification email first, then OpenClaw plugin planning, field-channel rollout order, and shared tool-surface rules |
| `google-business-profile-chat.md` | Deferred evaluation note for Google Business Profile messaging, response-time constraints, and lead-capture expansion rules |
| `business-scorecard-and-growth.md` | KPIs, MRR, asset inventory, operating rhythm, milestones, and tool recommendations |
| `payload-native-crm-and-billing.md` | Product direction, design rules, data model, billing split, automation roadmap |
| `stripe-billing-and-customer-payment-operations.md` | Stripe-hosted invoice, portal, subscription, and out-of-band payment operating model |
| `hubspot-capability-map-and-first-party-crm.md` | Map HubSpot CRM primitives into first-party Payload collections, Next routes, Stripe webhooks, and compact ops UI |
| `quote-system-and-texas-compliance.md` | Internal quotes, tax-process guidance, and pricing formulas |
| `customer-site-content-and-engagebay.md` | Public URLs, CMS workflow, and content checklist; update as the in-house CRM replaces old references |
| `team-login-and-vault.md` | Login, credential ownership, and rotation process |
| `admin-portal-quotes-ux.md` | Admin, portal, internal dashboard, and quote UX backlog |
| `content-and-seeding.md` | Seed content workflow, baseline content ownership, and reset path |
| `payload-mcp-and-editor-setup.md` | Payload MCP enablement, migration gate, and local Cursor/Codex setup |
| `image-generation-mcp-and-media-workflow.md` | Vendored image-generation MCP server, Python env isolation, editor wiring, and media-asset workflow |
| `operating-rhythm-roles-and-reminders.md` | Internal role matrix, daily queue rhythm, SLA defaults, reminder policy, and customer/admin boundary guardrails |
| `frontend-and-code-quality-conventions.md` | UI/icon usage standards, file-size guardrails, string-literal/enum policy, and extraction/reuse conventions |
| `refactor-extraction-roadmap.md` | Target folder structure, phased extraction strategy, and prioritized refactor queue for reusable architecture |
| `site-integrations-and-launch-checklist.md` | Current launch checklist for Payload, Stripe, Resend, and the customer quote flow |
| `demo-data-and-flows.md` | Demo personas, seeded scenarios, and scripted paths for launch demos (staff + customer) |
| `ai-ops-assistant-beta.md` | Optional staff AI assistant: RAG, Vercel AI SDK, Assistant/Tool UI, vision screenshot flow, feature flag and beta scope (phase 08) |

Integration specs and policies stay here. Product backlog and UX planning also use `ROADMAP.xml` and `phases/`.

Start each doc with **owner**, **tools**, and **last reviewed** date where it helps.

Rule of thumb: process and playbooks can live in private git and admin-only tools; customer records belong in Payload and connected production systems once integrations are active.
