# Grime Time (`grime_time_site`)

Exterior-cleaning marketing site and admin, based on the official Payload **[with-vercel-website](https://github.com/payloadcms/payload/tree/main/templates/with-vercel-website)** template (Next.js App Router, [layout builder](https://github.com/payloadcms/payload/tree/main/templates/with-vercel-website#layout-builder), SEO, forms, drafts).

**Planning & workflows:** [`.planning/`](.planning/) (RepoPlanner). **CRM:** EngageBay — map in [`.planning/workflows/crm-and-integrations.md`](.planning/workflows/crm-and-integrations.md), checklist in [`.planning/workflows/engagebay-integration-review.md`](.planning/workflows/engagebay-integration-review.md). **Lead process:** [`.planning/workflows/lead-to-customer-runbook.md`](.planning/workflows/lead-to-customer-runbook.md).

## Quick start (local)

1. Copy env: `cp .env.example .env` and set `POSTGRES_URL` (use **Supabase** Postgres URI or local/Vercel Postgres), `PAYLOAD_SECRET`, `CRON_SECRET`, `PREVIEW_SECRET`. For uploads in production, set **Supabase Storage** vars (`SUPABASE_URL`, `SUPABASE_S3_ACCESS_KEY_ID`, `SUPABASE_S3_SECRET_ACCESS_KEY`) and create a **public** bucket named `media` (see `.env.example`). **Transactional email (Payload + forms):** set **`RESEND_API_KEY`**, **`EMAIL_FROM`** (must be a [verified](https://resend.com/docs/dashboard/domains/introduction) sender/domain), and optional **`EMAIL_FROM_NAME`**. Without `RESEND_API_KEY`, Payload falls back to console-only email. Optional: **`QUOTES_INTERNAL_ENABLED=true`** and **`QUOTES_INTERNAL_EMAILS`** (comma-separated, must match Payload user emails) to show **Internal → Quotes** in admin. **EngageBay:** `ENGAGEBAY_API_KEY`, etc. (see `.env.example`).
2. `npm install`
3. `npm run payload migrate` (applies schema such as the `quotes` collection)
4. `npm run dev` → [http://localhost:3001](http://localhost:3001) (port **3001** avoids clashes with other apps on 3000; use `npm run dev:3000` if you want 3000)
5. Open **`/admin`**. On an empty database, create the **first** admin user (you can use `bg@grimetime.local` / `changethis` to match seed defaults).
6. In the admin dashboard, click **Seed the database** (destructive: resets seeded collections). After seed, you can log in as any of:
   - `bg@grimetime.local`
   - `pb@grimetime.local`
   - `de@grimetime.local`  
   Password (dev): **`changethis`** — **change before production.**  
   After enabling quotes in `.env`, include these emails in `QUOTES_INTERNAL_EMAILS` so **Quotes** is visible.

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
| `npm run build` / `npm start` | Production build (Turbopack by default) & run |
| `npm run payload migrate` | Run DB migrations (Postgres) |
| `npm run planning -- snapshot` | RepoPlanner CLI |

**Build without a database:** If `POSTGRES_URL` is unset, `next build` still completes using stubs (empty globals, no static paths from collections). **Vercel** must set `POSTGRES_URL` so pages and posts prerender from real data.

### Pricing & services (CMS)

- **Globals → Pricing & packages:** section title, intro, and repeatable **plans** (name, price, features, CTA link). Edits revalidate the pricing cache tag.
- **Pages → Layout:** add **Service grid** (services list, `#services`) and **Pricing table** (`#pricing`). For the table, choose **Use global pricing data** to pull from the global above, or **Inline plans** for page-specific packages.

### Migrations: “already exists” / `payload migrate` fails on initial

If the database was first created with **`payload db push`** (or similar) and **`payload_migrations` does not** list `20260319_165018_initial`, running `npm run payload migrate` will try to apply the initial migration and Postgres may error (e.g. `type "enum_..._already exists`). **Baseline** the first migration, then run migrate again:

```sql
INSERT INTO payload_migrations (name, batch, updated_at, created_at)
VALUES ('20260319_165018_initial', 1, now(), now());
```

Then `npm run payload migrate` — only pending migrations (e.g. `20260322_035532_add_pricing_global_resend`) run. If your DB is disposable, you can instead drop the public schema and migrate from scratch.

## Deploy (Vercel)

Use the Vercel “Deploy” flow from the [Payload template README](https://github.com/payloadcms/payload/blob/main/templates/with-vercel-website/README.md) as a reference: connect **Postgres** — this repo uses **`@payloadcms/db-postgres`** with **`POSTGRES_URL`** (Supabase **direct** URI on port `5432` is best for `payload migrate`; see `.env.example`). For **media** uploads we use **Supabase Storage** (S3 API, bucket `media`); set the env vars in `.env.example`.

Build command for CI: `npm run ci` (migrates then builds). Set the same env vars on Vercel as locally, including **`RESEND_API_KEY`** / **`EMAIL_FROM`** if you want real form and admin emails.

## Upstream template

Full feature list and detailed docs live in the [Payload monorepo template README](https://github.com/payloadcms/payload/blob/main/templates/with-vercel-website/README.md). This repo is a project fork of that template plus Grime Time–specific seed users and planning files.
