# Todo: instant-quote-app-block

**Captured:** 2026-04-07
**Area:** page architecture / app blocks / composer
**Urgency:** normal

## What

Convert the hard-coded instant quote range section into a first-class page block, likely in the app/custom block lane, so it can be inserted and arranged as part of a page layout even if it remains code-owned and non-visual in the composer.

## Why

The current frontend route special-cases the quote tool on `/`, which breaks the “page = ordered blocks” mental model and keeps a major conversion surface outside the block system.

## Context

Current behavior:
- `src/app/(frontend)/[slug]/page.tsx` injects `InstantQuoteSection` when `slug === 'home'`
- `src/components/InstantQuoteSection.tsx` is highly custom and not intended for visual editing

Desired direction:
- keep the block code-owned
- expose it as a block in page layout, likely under an `app` / `custom` bucket
- avoid route-only hard-coded insertion

## Suggested next action

Plan this alongside the broader layout-first page model so hero and app/custom surfaces move into the same ordered block architecture instead of adding another one-off special case.
