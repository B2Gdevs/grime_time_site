# Grime Time (`grime_time_site`)

Exterior-cleaning marketing site and admin, based on the official Payload **[with-vercel-website](https://github.com/payloadcms/payload/tree/main/templates/with-vercel-website)** template (Next.js App Router, [layout builder](https://github.com/payloadcms/payload/tree/main/templates/with-vercel-website#layout-builder), SEO, forms, drafts).

**Planning & workflows:** [`.planning/`](.planning/) (RepoPlanner). **CRM direction:** EngageBay — see [`.planning/workflows/engagebay-integration-review.md`](.planning/workflows/engagebay-integration-review.md).

## Quick start (local)

1. Copy env: `cp .env.example .env` and set `POSTGRES_URL` (use **Supabase** Postgres URI or local/Vercel Postgres), `PAYLOAD_SECRET`, `CRON_SECRET`, `PREVIEW_SECRET`, and `BLOB_READ_WRITE_TOKEN` if using Vercel Blob.
2. `npm install`
3. `npm run dev` → [http://localhost:3000](http://localhost:3000)
4. Open **`/admin`**. On an empty database, create the **first** admin user (you can use `bg@grimetime.local` / `changethis` to match seed defaults).
5. In the admin dashboard, click **Seed the database** (destructive: resets seeded collections). After seed, you can log in as any of:
   - `bg@grimetime.local`
   - `pb@grimetime.local`
   - `de@grimetime.local`  
   Password (dev): **`changethis`** — **change before production.**

## Repo layout

| Path | Purpose |
|------|---------|
| `src/` | Next.js + Payload app |
| `.planning/` | Roadmap, PRD, workflow docs |
| `vendor/repo-planner` | Planning CLI submodule |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build (`next build --webpack` for correct Payload UI Sass resolution) & run |
| `npm run payload migrate` | Run DB migrations (Postgres) |
| `npm run planning -- snapshot` | RepoPlanner CLI |

**Build without a database:** If `POSTGRES_URL` is unset, `next build` still completes using stubs (empty globals, no static paths from collections). **Vercel** must set `POSTGRES_URL` so pages and posts prerender from real data.

## Deploy (Vercel)

Use the Vercel “Deploy” flow from the [Payload template README](https://github.com/payloadcms/payload/blob/main/templates/with-vercel-website/README.md) as a reference: connect **Postgres** (Neon in the one-click flow — you may **replace** with **Supabase** by setting `POSTGRES_URL` to your Supabase connection string) and **Blob** storage, then set secrets (`PAYLOAD_SECRET`, `CRON_SECRET`, `PREVIEW_SECRET`).

Build command for CI: `npm run ci` (migrates then builds).

## Upstream template

Full feature list and detailed docs live in the [Payload monorepo template README](https://github.com/payloadcms/payload/blob/main/templates/with-vercel-website/README.md). This repo is a project fork of that template plus Grime Time–specific seed users and planning files.
