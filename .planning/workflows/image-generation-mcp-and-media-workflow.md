# Image Generation MCP and Media Workflow

Owner
- team

Tools
- `vendor/image-gen-mcp`
- `uv`
- Cursor MCP
- Codex MCP
- Payload admin media library

Last reviewed
- 2026-03-25

Purpose
- Add a repo-owned image-generation MCP server so Codex and Cursor can generate marketing and product imagery quickly without leaving the project workflow.
- Keep the Python environment self-contained inside the vendored MCP server.
- Standardize how generated images move into Payload media or the public asset path for hero art, cards, features, textures, and section backgrounds.

Planning anchors
- Phase: `04`
- Tasks: `04-03`, `04-06`
- Related phase: `03` for generated marketing/media usage

Repo files
- [`vendor/image-gen-mcp`](../../vendor/image-gen-mcp)
- [`.env.example`](../../.env.example)
- [`package.json`](../../package.json)
- [`scripts/verify-mcp.mjs`](../../scripts/verify-mcp.mjs)
- [`src/lib/media/image-generation-manifest.ts`](../../src/lib/media/image-generation-manifest.ts) — **prompts, style rules, `wiredTo`, batches, `enabled` backlog**
- [`scripts/generate-marketing-images.ts`](../../scripts/generate-marketing-images.ts) — **CLI:** OpenAI → JPEG/WebP/PNG → Payload `media` (stable filenames; relationships keep same IDs)
- [`src/lib/media/openaiImageGeneration.ts`](../../src/lib/media/openaiImageGeneration.ts) — shared with [`src/app/api/internal/media/generate/route.ts`](../../src/app/api/internal/media/generate/route.ts)
- [`scripts/image-gen-mcp-setup.mjs`](../../scripts/image-gen-mcp-setup.mjs)
- [`scripts/image-gen-mcp-start.mjs`](../../scripts/image-gen-mcp-start.mjs)
- [`scripts/dev-with-services.mjs`](../../scripts/dev-with-services.mjs)
- [`.cursor/mcp.json`](../../.cursor/mcp.json)
- [`.codex/payload-mcp.example.toml`](../../.codex/payload-mcp.example.toml)
- [`.codex/image-gen-mcp.example.toml`](../../.codex/image-gen-mcp.example.toml)

Operational goals
- Vendor the upstream MCP server so its version is pinned and reviewable in git.
- Keep its Python dependencies isolated under the vendored repo via `uv sync`.
- Provide repo-local setup and start commands so the team does not manage the server manually.
- Make local editor configs for Cursor and Codex point at the repo-local launcher instead of ad hoc global paths.
- Keep image generation optional and env-gated so normal site development still works when the image server is off.

Environment contract
- Root `.env` remains the source of truth for image-generation provider settings.
- The vendored MCP server should read the root `.env` file rather than requiring a second secret file under the submodule.
- Required keys depend on provider:
  - OpenAI: `PROVIDERS__OPENAI__API_KEY`
  - Gemini / Imagen: `PROVIDERS__GEMINI__API_KEY`
- Runtime toggles:
  - `IMAGE_GEN_MCP_ENABLED`
  - `SERVER__HOST`
  - `SERVER__PORT`
  - `SERVER__LOG_LEVEL`

Dev-process target
1. `npm run image-mcp:setup` should initialize the vendored Python environment with `uv sync`.
2. `npm run image-mcp:start` should start the server using the root `.env`.
3. `npm run dev` or an adjacent dev helper should be able to start the image MCP alongside Next dev when `IMAGE_GEN_MCP_ENABLED=true`.
4. Cursor and Codex should be able to launch the same repo-local server command for MCP usage.
5. `npm run verify:mcp` should confirm both MCPs are wired correctly before editor sessions depend on them.

Current implementation
- `git submodule add` pins the upstream server at `vendor/image-gen-mcp`.
- `npm run image-mcp:setup` runs `uv sync` inside the vendored repo and creates its local `.venv`.
- `npm run image-mcp:start` starts the HTTP server using the root `.env`.
- `npm run image-mcp:stdio` exposes the stdio transport for MCP clients.
- `npm run verify:mcp` validates Cursor/Codex config stubs, Payload MCP reachability, and image-gen stdio startup.
- `npm run dev` now uses `scripts/dev-with-services.mjs` and starts the image MCP only when `IMAGE_GEN_MCP_ENABLED=true`.
- Cursor and Codex examples now point at the repo-local Node launcher, which then starts the vendored Python server.

CLI marketing images (no MCP required)
- **Manifest (prompts, style, wiring, backlog):** [`src/lib/media/image-generation-manifest.ts`](../../src/lib/media/image-generation-manifest.ts) — single source of truth for what we generate, global negative constraints (no people/text/logos), per-asset `promptBody`, `category`, `wiredTo` (seed routes or `library` if unassigned), and `enabled` (skip generation while still documented).
- **Inspect without generating:** `npm run generate:marketing-images -- --list` prints batches, filenames, wiring, and disabled backlog entries.
- **Inspect media presence/URLs:** `npm run generate:marketing-images -- --status` checks the selected batch in Payload and prints `present/missing` with media URL when available.
- **Default:** `npm run generate:marketing-images` runs the **`core`** batch only (`seed-grime-*.jpg` — house, driveway, property). Same env as seed: `PROVIDERS__OPENAI__API_KEY` / `OPENAI_API_KEY`, `SEED_LOGIN_*` or `ADMIN_*`. Existing filenames are preserved unless overwrite is requested.
- **Overwrite safety:** generation now **skips existing filenames by default**. Use `--overwrite-existing` (or `--force`) only when you intentionally want refreshed binaries.
- **Blog headers:** `npm run generate:marketing-images -- --include-posts` adds **`posts`** (`image-post1.webp` … `image-post3.webp`).
- **Extended library (textures, service shots, commercial, UI graphs, logo concept PNG):** `npm run generate:marketing-images -- --library` generates only the **`extended`** batch (new `seed-*` / `seed-ui-*` filenames — creates or updates `media` rows; not wired in seed until you assign in admin or extend `src/endpoints/seed/index.ts`).
- **Core + library in one run:** `npm run generate:marketing-images -- --with-library` (and optionally `--include-posts`).
- **All batches:** `npm run generate:marketing-images -- --everything`.
- Optional env: `OPENAI_IMAGE_MODEL` (default `gpt-image-1`).
- **Hero note:** Homepage high-impact hero uses **`seed-grime-driveway.jpg`** (see manifest `wiredTo`). The driveway prompt is tuned for a more cinematic hero than the house/property shots.

Media workflow target
- Generated images should be easy to move into:
  - Payload media for managed hero/card/feature assets
  - `public/` for static backgrounds or design textures when CMS management is unnecessary
- Longer-term follow-up:
  - Add a small internal runbook for prompt style, naming, storage choice, and image review before publishing
  - Consider a first-party import helper that can ingest generated files into Payload media directly

Open questions
- Should generated images default into Payload media, `public/`, or choose based on asset type?
- Do we want a small internal gallery/import tool in `/ops`, or is editor-driven generation plus Payload upload enough for v1?
- Should the image MCP run automatically inside the default `npm run dev`, or should that be an explicit `dev:with-mcp` mode if the team wants lighter startup?
