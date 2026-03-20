# Planning (RepoPlanner)

This repo uses [RepoPlanner](https://github.com/MagicbornStudios/RepoPlanner) as a submodule at `vendor/repo-planner`. The CLI reads **this directory** when run from the repository root.

**Direction (see REQUIREMENTS.xml):** [Payload `with-vercel-website`](https://github.com/payloadcms/payload/tree/main/templates/with-vercel-website) on Vercel, PostgreSQL via **Supabase**, exterior-cleaning marketing + ops workflows; CRM tool (EngageBay vs HubSpot) still open.

## Commands

```bash
npm install
npm run planning -- snapshot
npm run planning -- setup checklist
npm run planning -- report generate
```

Note: upstream docs sometimes mention `loop-cli.mjs init`; the current CLI uses **`setup checklist`** to verify `.planning/` after bootstrap. See `vendor/repo-planner/README.md` and `INSTALL.md`.
