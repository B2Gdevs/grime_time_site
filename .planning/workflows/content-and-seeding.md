# Content, templates, and seeding (Supabase + Payload)

## How this fits together

- **Supabase Postgres** is only the database. All pages, copy, globals, and media **metadata** live in Payload collections/tables — there is no separate “Supabase CMS.”
- **Version-controlled baseline content** lives in **`src/endpoints/seed/`** (`home.ts`, `contact-page.ts`, `index.ts`, globals like pricing, etc.). That is the right place to define or refine Grime Time marketing copy, layout blocks, and sample posts so every environment can be reset to the same story.
- **Runtime edits** happen in **Payload Admin** (or any client that calls the Payload API with auth).

## Right now: how to load template content

1. Run **`payload migrate`** so the schema matches the repo.
2. Sign in to **`/admin`** with email and password.  
3. Use **Seed the database** on the dashboard (same as **`POST /next/seed`**) — **idempotent upsert**: finds baseline docs by stable keys (page/post **slugs**, media **filename**, form **title** `Contact Form`, staff **emails**) and creates or updates them. It does **not** delete arbitrary CMS data; **header, footer, and pricing globals** are still overwritten from seed on each run so those stay aligned with `index.ts`.

For **CLI / CI**, use **`npm run seed`**. It accepts **`SEED_LOGIN_EMAIL`** + **`SEED_LOGIN_PASSWORD`**, or — if those are unset — the same **`ADMIN_EMAIL`** + **`ADMIN_PASSWORD`** you use for **`npm run bootstrap:admin`** (must be an **admin** user). See `.env.example`.

## Current planning focus

The seed flow is the active path for the public site right now. The immediate content package should cover:

- published `home` page with real hero, services, trust, CTA, and service-area language
- supporting pages for `about`, `contact`, and service/category pages if needed
- clear "book estimate" and "get quote" CTAs wired into forms or scheduling
- review/testimonial and before/after proof content that staff can update quickly in Payload admin

Seed should provide the baseline story. Payload admin should become the fast editing layer for proof and copy tweaks after launch.

## Payload MCP

If you add Payload’s **MCP server** in Cursor, agents can create/update documents through the **Payload API**. That’s useful for **ad-hoc** content experiments or bulk edits from chat. It does **not** replace seed files:

| Approach | Best for |
|----------|----------|
| **`src/endpoints/seed/*.ts`** | Onboarding, staging/prod parity, “known good” marketing copy in git |
| **Admin UI** | Day-to-day edits, non-dev users |
| **MCP / API** | Agent-assisted drafts, migrations, one-off imports |

After MCP changes you care to keep, **copy the result back into seed** (or document the delta) so new databases and deploys stay reproducible.

## Improving copy “right here right now”

1. Edit **`src/endpoints/seed/home.ts`** (hero Lexical JSON, layout blocks) and related seed modules. Extra home layout after the service grid + pricing table lives in **`src/endpoints/seed/home-marketing-blocks.ts`** (trust copy, gallery `mediaBlock`s, archive intro, CTA).
2. Run seed again from admin or **`npm run seed`** (with admin credentials).
3. Optional: tune **`src/endpoints/seed/home-static.ts`** only for the edge case when the DB is unreachable at build time (keep it minimal; real site should use DB content).

**Stock images:** `SEED_MEDIA` in **`src/endpoints/seed/index.ts`** may pull remote URLs (e.g. Unsplash) for placeholder job photos. Replace filenames in **Admin → Media** with real Grime Time assets when available; URLs can 404 over time — update the seed URL or host files on a stable origin.

**Media upserts must be sequential** in seed: `payload.create` assigns **`req.file`** on the shared local request. Parallel `Promise.all` media creates race and can throw **`MissingFile`** or attach the wrong binary.

## Reviews, testimonials, and proof

Treat social proof as launch-critical content, not a later nicety.

- **Seed first:** include realistic placeholder testimonials, trust badges, and before/after sections in seed so the site has a complete structure.
- **Admin next:** move testimonials and proof into the fastest acceptable Payload editing path for non-devs.
- **Decision still open:** fastest path could be a dedicated collection, a reusable block, or a global. The planning anchor for that choice is phase `03`, task `03-03`.

## Note on revalidation

Seeding without a running Next server can log **revalidate** errors — safe to ignore for local/CLI seed, as noted in `src/endpoints/seed/index.ts`.

## Seed vs Payload schema (avoid `ValidationError`)

Seed JSON must satisfy **the same limits** as the admin UI. Common breakages:

| Symptom | Typical cause |
|---------|----------------|
| `Hero > Links` invalid | Hero `linkGroup` **`maxRows`** in `src/heros/config.ts` is smaller than the number of items in `home.ts` → `hero.links` |
| Categories + `25P02` / “transaction is aborted” | **`categories`** upsert must find by the **same slug** Payload stores (slugField lowercases). Old seed used `slug: title` (`Technology`) while DB has `technology` → duplicate insert + parallel `Promise.all` made the error opaque. Use explicit `{ title, slug }` lowercase in `index.ts` and **sequential** upserts. |
| Other array fields | Same idea: `maxRows` on blocks / `linkGroup` (e.g. CTA blocks default to 2 links) |

**Process:** After changing field `maxRows`, `required`, or block configs, update matching seed files and run **`npm run seed`** again (upsert is idempotent). On failure, `runSeed` logs **Payload validation detail** (field paths) to the console.

**Do not** rely on “skip failed steps and continue” for seed — a half-seeded DB is harder to reason about than a clear error + fix + re-run.
