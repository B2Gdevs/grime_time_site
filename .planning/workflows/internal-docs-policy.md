# Internal documentation policy

**Owner:** TBD  
**Last reviewed:** 2026-03-20  

## Goal

Business process docs (how you sell, follow up, hand off jobs, use the CRM) should stay **internal**—not on the public website and not discoverable by competitors or crawlers.

## Recommended layers

| Layer | What goes here | Access |
|-------|----------------|--------|
| **Private Git repo** | `.planning/`, workflow markdown in this folder, ADRs, integration notes without secrets | GitHub/GitLab **private** org/repo; branch protection on `main` |
| **CRM** | Contacts, deals, email history, tasks—**operational** customer data | Same org, role-based users (see `crm-org-and-sync.md`) |
| **Password manager** (e.g. 1Password Business) | Shared logins for CRM, email, telephony—not in git | Team vault, least privilege |

Do **not** put API keys, CRM private app tokens, or customer PII in committed docs. Use env vars + secret stores (Vercel, Supabase vault patterns, or the password manager).

## If the GitHub repo is public

Either:

1. **Make the repo private** (simplest for `.planning/` and process docs), or  
2. Move sensitive markdown to a **second private repo** (e.g. `grime-time-ops`) and keep this repo for code + public-safe README only, or  
3. Keep process docs only in **Payload** as admin-only collections (no public API) or in **Notion/Confluence** private space.

## Payload-specific option (later)

- Add a collection like `InternalGuides` with `access: ({ req }) => Boolean(req.user)` and **no** public routes—process docs live next to the app but only for logged-in staff.

## What stays in this repo today

Planning artifacts under `.planning/` are **strategy and structure**, not live customer data. Treat the repo as **confidential** if it contains business process detail; prefer a **private repo** for anything you would not want indexed.
