# Resolved: service-grid media target and canvas lane drift

Date: 2026-04-07

## Symptom

Hero media placement worked in the composer, but service-grid and pricing-step rows felt broken:

- selecting a row from the Media tab did not make the matching row visible on canvas
- assigned media looked like it did not render for service-grid rows
- `Use this media` could target a lane in the drawer while the canvas still showed a different lane

OS file drops still registered, which showed the slot chrome itself was not the main failure.

## Root cause

`ServiceGrid` kept its visible row in local `activeIndex` state, while the composer drawer tracked the targeted media slot separately with `selectedMediaPath`.

That created two sources of truth:

- drawer/gallery target: `layout.<block>.services.<row>.media`
- canvas-visible lane: local `activeIndex`

Hero did not show the same bug because it has a single stable slot (`hero.media`).

## Fix

- Added `selectedMediaRelationPath` to the shared page-composer toolbar state.
- Published that relation path from `PageComposerDrawer` whenever the media tab targets a slot.
- Updated `ServiceGrid` to derive the visible lane from the targeted media relation path when the composer is selecting service-row media.
- Added focused integration coverage for both the drawer-side targeting flow and the service-grid canvas-side lane sync.

## Follow-up

This fixes the immediate service-grid/pricing-step media placement drift, but the larger architectural cleanup is still valid:

- move hero into the same layout/block system
- make instant quote a code-owned app/custom block
- replace block-specific media targeting rules with a shared slot model
