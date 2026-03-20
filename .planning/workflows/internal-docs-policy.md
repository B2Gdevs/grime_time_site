# Internal documentation policy

**Owner:** TBD  
**Last reviewed:** 2026-03-20  

## Goal

**Customers** only see the public site and appropriate forms—not internal quotes or ops tools. **Business process** documentation should be written in **good faith** and stay **pragmatic** (what we actually do, not marketing copy).

The **GitHub repo may stay public** for transparency as long as we **never commit** API keys, tokens, customer PII, or credentials. High-level planning in `.planning/` is OK public; move anything sensitive to a private space or env secrets.

## Recommended layers

| Layer | What goes here | Access |
|-------|----------------|--------|
| **Git repo (public OK)** | `.planning/` strategy, integration *plans*, formulas *templates* — **no secrets** | If public: redact; prefer private for detailed playbooks |
| **Private Git repo** | Detailed SOPs, anything competitive you don’t want indexed | Optional second private repo |
| **CRM** | Contacts, deals, email history, tasks—**operational** customer data | Same org, role-based users (see `crm-org-and-sync.md`) |
| **Password manager** (e.g. 1Password Business) | Shared logins for CRM, email, telephony—not in git | Team vault, least privilege |

Do **not** put API keys, CRM private app tokens, or customer PII in committed docs. Use env vars + secret stores (Vercel, Supabase vault patterns, or the password manager).

## If the GitHub repo is public (allowed)

1. Keep **secrets out** of git (`.env`, API keys, EngageBay keys, customer exports).  
2. Move **detailed** internal playbooks to a **private** repo, **Payload admin-only** collection, or **Notion** if you need confidentiality beyond high-level planning.  
3. **Quote system** and internal tools stay **feature-flagged** and **admin-only** in the app—not linked from the public site.

## Payload-specific option (later)

- Add a collection like `InternalGuides` with `access: ({ req }) => Boolean(req.user)` and **no** public routes—process docs live next to the app but only for logged-in staff.

## What stays in this repo today

Planning artifacts under `.planning/` should remain **non-sensitive** if the repo is public (strategy, checklists, formula *structures*). Live customer data belongs in **EngageBay** and production databases, not in markdown commits.
