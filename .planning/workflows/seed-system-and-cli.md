# Seed system & developer CLI (Grime Time only)

**Owner:** TBD  
**Phase:** [`09`](../phases/09-seed-system-and-cli/) (see `PLAN.xml`)  
**Decision:** [`DECISIONS.xml`](../DECISIONS.xml) `D-seed-001`

## Purpose

- Split **foundation**, **content** (media, pages, layout blocks, globals), and **demo** (CRM/billing/personas) into composable seed modules.
- Provide a **first-class CLI** (dry-run, confirmations, selective `--only`, `--force`) for this repo — not a generic CMS authoring tool.
- Detect **media redundancy** across seeded layout slots (same `media` id reused where distinct imagery was intended).
- Wire **demo modules** into unit / integration / e2e tests with stable, documented profiles.

## Repo anchors

| Area | Path |
|------|------|
| **grimetime** CLI (citty) | `src/cli/grimetime.ts`, `src/cli/run-main.ts`, `src/cli/seed/seed-commands.ts`, `bin/grimetime.mjs` (`package.json` `bin`) |
| Seed scopes (push deps) | `src/endpoints/seed/scopes.ts`, `src/endpoints/seed/orchestrate-push.ts` (`runSeedPush`) |
| Main seed orchestrator | `src/endpoints/seed/index.ts` |
| Upsert helpers | `src/endpoints/seed/upsert.ts` |
| Seed script (npm / Payload) | `scripts/seed.ts` → `src/cli/lib/seed-runner.ts` |
| Admin HTTP seed | `src/app/(frontend)/next/seed/route.ts` |
| Demo fixtures | `src/endpoints/seed/demo-seed.ts`, `demo-personas.ts` |
| Home / marketing seed | `src/endpoints/seed/home.ts`, `home-marketing-blocks.ts` |

## Status

Planning phase **09** — implementation tracked in `.planning/TASK-REGISTRY.xml` (tasks `09-xx`).
