# Resolved: service-grid media target and canvas lane drift

Date: 2026-04-07

## Symptom

Hero media placement worked in the composer, but service-grid and pricing-step rows felt broken:

- selecting a row from the Media tab did not make the matching row visible on canvas
- assigned media looked like it did not render for service-grid rows
- `Use this media` could target a lane in the drawer while the canvas still showed a different lane

OS file drops still registered, which showed the slot chrome itself was not the main failure.

## Root cause

There were two separate failures in this area:

1. The interactive service-grid canvas could drift away from the drawer-targeted media lane.
2. The inline media wrapper for fill images did not always occupy the full media slot, which let `next/image` inherit a parent height of `0`.

`ServiceGrid` kept its visible row in local `activeIndex` state, while the composer drawer tracked the targeted media slot separately with `selectedMediaPath`.

That created two sources of truth:

- drawer/gallery target: `layout.<block>.services.<row>.media`
- canvas-visible lane: local `activeIndex`

Hero did not show the same lane-targeting bug because it has a single stable slot (`hero.media`).

The later browser warning confirmed the sizing issue directly:

- `Image ... has "fill" and a height value of 0`

That warning came from `InlinePageMediaEditor` rendering a `fill` image inside a wrapper that was `relative` but not guaranteed to be `block h-full w-full`.

## Fix

- Added `selectedMediaRelationPath` to the shared page-composer toolbar state.
- Published that relation path from `PageComposerDrawer` whenever the media tab targets a slot.
- Updated `ServiceGrid` to derive the visible lane from the targeted media relation path when the composer is selecting service-row media.
- Removed the last dependency on local `activeIndex` as the source of truth for the interactive renderer. The visible lane, media relation path, inline field paths, and media-panel remount key now all use the targeted relation path first.
- Updated `InlinePageMediaEditor` so the rendered media wrapper is `block h-full w-full`, giving `next/image fill` a real sized parent and fixing the invisible-but-present service-grid image bug that was still reproducing after assignment.
- Added focused integration coverage for both the drawer-side targeting flow and the service-grid canvas-side lane sync.

## Evidence

- The internal composer payload for `/` showed the saved change at `layout.1.services.2.media`, including the updated media document (`id: 7`).
- The remaining failure was therefore render-only: saved service-grid media could still look stale on canvas because the interactive view was rendering whichever lane local state last held instead of the currently targeted media slot.
- The later DOM inspection showed the service-grid image element was present with the correct media URL, but the browser logged that its `fill` parent height was `0`.
- Commit `e97b9c1` shipped the wrapper sizing fix for that media-height bug.
- Regression coverage now asserts that even if a user clicks another service button while a row media slot is targeted, the targeted lane remains the visible lane on canvas.

## Follow-up

This fixes the immediate service-grid/pricing-step media placement drift, but the larger architectural cleanup is still valid:

- move hero into the same layout/block system
- make instant quote a code-owned app/custom block
- replace block-specific media targeting rules with a shared slot model
