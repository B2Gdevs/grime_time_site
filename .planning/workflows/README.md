# Workflow documentation (living)

Use this folder for human-readable runbooks as you lock workflows. Suggested docs:

| Doc | Purpose |
|-----|---------|
| `internal-docs-policy.md` | Public repo OK for non-sensitive planning; no secrets; internal tools feature-flagged |
| `crm-org-and-sync.md` | One CRM org (EngageBay), mixed email domains, site ↔ CRM sync patterns |
| `engagebay-integration-review.md` | API/webhooks/SDK notes and checklist before production CRM cutover |
| `quote-system-and-texas-compliance.md` | Internal quotes, Texas tax *process* (CPA), economics & capacity formulas |
| `lead-to-customer.md` | Intake → contact → follow-up → job booked |
| `crm-and-integrations.md` | EngageBay / HubSpot (or other) touchpoints, webhooks, who owns data |
| `team-login-and-vault.md` | Single place to work: Payload admin, where credentials live, rotation |

Start each doc with **owner**, **tools**, and **last reviewed** date.

**Rule of thumb:** Process and playbooks live in **private** git and/or admin-only tools; **customer records** live in the **CRM** once you connect it.
