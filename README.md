# Grime Time (`grime_time_site`)

Exterior-cleaning marketing site and admin, based on the official Payload **[with-vercel-website](https://github.com/payloadcms/payload/tree/main/templates/with-vercel-website)** template (Next.js App Router, [layout builder](https://github.com/payloadcms/payload/tree/main/templates/with-vercel-website#layout-builder), SEO, forms, drafts).

**Planning & workflows:** [`.planning/`](.planning/) (RepoPlanner). **Roadmap / phases:** [`.planning/ROADMAP.xml`](.planning/ROADMAP.xml), [`.planning/phases/`](.planning/phases/). **CRM:** EngageBay — [`.planning/workflows/crm-and-integrations.md`](.planning/workflows/crm-and-integrations.md), checklist [`.planning/workflows/engagebay-integration-review.md`](.planning/workflows/engagebay-integration-review.md). **Lead process (staff, in portal):** sign in as admin → **Docs** → *Lead to customer runbook* ([`src/content/docs/lead-to-customer-runbook.md`](src/content/docs/lead-to-customer-runbook.md)). **Admin GitHub login:** [`.planning/workflows/supabase-github-admin-auth.md`](.planning/workflows/supabase-github-admin-auth.md). **Content & seeding:** [`.planning/workflows/content-and-seeding.md`](.planning/workflows/content-and-seeding.md). **UX backlog (portal / admin / quotes):** [`.planning/workflows/admin-portal-quotes-ux.md`](.planning/workflows/admin-portal-quotes-ux.md).

## Quick start (local)

1. Copy env: `cp .env.example .env` and set `POSTGRES_URL` (use **Supabase** Postgres URI or local/Vercel Postgres), `PAYLOAD_SECRET`, `CRON_SECRET`, `PREVIEW_SECRET`. For uploads in production, set **Supabase Storage** vars (`SUPABASE_URL`, `SUPABASE_S3_ACCESS_KEY_ID`, `SUPABASE_S3_SECRET_ACCESS_KEY`) and create a **public** bucket named `media` (see `.env.example`). **Transactional email (Payload + forms):** set **`RESEND_API_KEY`**, **`EMAIL_FROM`** (must be a [verified](https://resend.com/docs/dashboard/domains/introduction) sender/domain), and optional **`EMAIL_FROM_NAME`**. Without `RESEND_API_KEY`, Payload falls back to console-only email. Optional: **`QUOTES_INTERNAL_ENABLED=true`** and **`QUOTES_INTERNAL_EMAILS`** (comma-separated, must match Payload user emails) to show **Internal → Quotes** in admin. **EngageBay:** `ENGAGEBAY_API_KEY`, etc. (see `.env.example`).
2. `npm install`
3. `npm run payload migrate` (applies schema — **required** on a new DB before `bootstrap:admin` / `npm run seed`. Dev `db push` is disabled so hosted Postgres isn’t hit with a giant auto-sync.)
4. `npm run dev` → [http://localhost:5465](http://localhost:5465) (default port **5465**; use `npm run dev:3000` for port 3000). The dev script stops any prior Next.js dev instance for this repo (or clears a stale lock) so you are not blocked by “Another next dev server is already running.”
5. Open **`/admin`**. **GitHub (Supabase):** set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, enable GitHub in Supabase, put Supabase’s `https://<ref>.supabase.co/auth/v1/callback` on the **GitHub OAuth app**, and add **`{NEXT_PUBLIC_SERVER_URL}/auth/callback`** under Supabase **Redirect URLs**. Allowlist your GitHub email (`PAYLOAD_OAUTH_ALLOWED_EMAILS` or `QUOTES_INTERNAL_EMAILS`). Details: [supabase-github-admin-auth.md](.planning/workflows/supabase-github-admin-auth.md). **Email/password:** Payload stores admins in the **`users` Postgres table** (your `POSTGRES_URL`), **not** under Supabase Dashboard → Authentication → Users. On an empty database you can create the first admin at `/admin/login`, or run `npm run bootstrap:admin`. If you’re locked out, run **`npm run admin:ensure`** with `ADMIN_EMAIL` / `ADMIN_PASSWORD` to create or reset that Payload user, then sign in with **email + password** on `/admin`.
6. In the admin dashboard, click **Seed the database** (idempotent: upserts home/contact, sample posts, team users, pricing global, etc.; it does **not** wipe unrelated CMS content). Seed **creates or updates Payload users** from **`QUOTES_INTERNAL_EMAILS`** when that variable is set (comma-separated); otherwise it uses `bg@grimetime.local`, `pb@grimetime.local`, and `de@grimetime.local`. **New** users get password **`changethis`** — **change before production** (existing users keep their password).  
   Use the same addresses in `QUOTES_INTERNAL_EMAILS` as your real staff logins so **Internal → Quotes** access matches who exists in Payload.

## Repo layout

| Path | Purpose |
|------|---------|
| `src/` | Next.js + Payload app |
| `.planning/` | Roadmap, PRD, workflow docs |
| `vendor/repo-planner` | Planning CLI submodule |

**Payload admin custom UI** (`beforeLogin`, `beforeDashboard`, …): the login screen uses **shadcn [login-03](https://ui.shadcn.com/blocks/login-03)** via `AdminLoginPanel` + `(payload)/custom.scss` importing shared `globals.css` (see `.planning/workflows/supabase-github-admin-auth.md`). **`/login`** is now the public account entry point, while **`/dashboard`** and **`/docs`** live in a protected customer/staff portal shell. Older admin chrome may still use colocated SCSS (`BeforeDashboard/`).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run bootstrap:admin` | Create the first admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` when the DB has no users; **exits 0** with a short message if users already exist (idempotent) |
| `npm run admin:ensure` | **Create or reset** a Payload admin (password + `admin` role) using `ADMIN_EMAIL` / `ADMIN_PASSWORD` — use when OAuth or seeded users fail; admins live in **Postgres**, not Supabase Auth |
| `npm run build` / `npm start` | Production build (Turbopack by default) & run |
| `npm run payload migrate` | Run DB migrations (Postgres) |
| `npm run seed` | Idempotent seed / upsert — uses `SEED_LOGIN_*` or falls back to **`ADMIN_EMAIL` / `ADMIN_PASSWORD`** (same as bootstrap) — same as admin “Seed the database” |
| `npm run planning -- snapshot` | RepoPlanner CLI |

### Customer portal / docs

- **`/login`**: customer sign-in/sign-up plus admin entry links.
- **`/dashboard`**: protected portal shell for customers and staff.
- **`/docs`**: protected docs reader. Customers see service/support help; admins also see workflow docs from `.planning/workflows/`.
- **Payload admin** remains internal-only; admin access is controlled by the `users.roles` field (`admin` vs `customer`).

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
