# Todo: layout-first-page-model-hero-block

**Captured:** 2026-04-07
**Area:** ui / cms / composer architecture
**Urgency:** normal
**Status:** done (2026-04-08)

## What

Refactor the marketing page model so a page is composed entirely from ordered layout blocks, with hero represented as a normal block in `layout` instead of a separate `hero` object. Remove route-specific home-only shell behavior from the page renderer and express that content as normal page blocks.

## Why

The current split model (`hero` plus `layout[]`) makes the composer inconsistent, keeps hero out of the normal block system, and creates special-case frontend behavior that conflicts with the desired “page = ordered blocks” mental model.

## Context

Current structure:
- `PageComposerDocument` in `src/lib/pages/pageComposer.ts` models pages as `hero + layout + routing/status fields`
- Frontend route rendering in `src/app/(frontend)/[slug]/page.tsx` renders `RenderHero(...)` before `RenderBlocks({ blocks: layout })`
- Composer block library and content surfaces currently special-case hero as page-owned instead of block-owned

User intent:
- hero should become a first-class layout block
- a CMS page should just be a layout made of blocks
- home-only shell pieces should not remain special frontend exceptions

## Suggested next action

Plan a dedicated refactor covering Payload schema changes, migration strategy for existing pages, composer state updates, and frontend renderer changes before implementation.

## Resolution

- Added first-class `heroBlock` support to page layout rendering and composer registry paths.
- Normalized frontend page rendering around `layout` blocks with legacy page-hero compatibility for existing documents.
- Removed the leftover home-only renderer reference so the repo points at the block-based model instead of a split shell.
