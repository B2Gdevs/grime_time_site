# Workflow documentation (living)

Use this folder for human-readable runbooks as you lock workflows. Suggested docs:

| Doc | Purpose |
|-----|---------|
| `internal-docs-policy.md` | Keep business/process documentation private (repo, Payload, CRM) |
| `crm-org-and-sync.md` | One CRM org, mixed email domains, site ↔ CRM sync patterns |
| `lead-to-customer.md` | Intake → contact → follow-up → job booked |
| `crm-and-integrations.md` | EngageBay / HubSpot (or other) touchpoints, webhooks, who owns data |
| `team-login-and-vault.md` | Single place to work: Payload admin, where credentials live, rotation |

Start each doc with **owner**, **tools**, and **last reviewed** date.

**Rule of thumb:** Process and playbooks live in **private** git and/or admin-only tools; **customer records** live in the **CRM** once you connect it.
