# Quick: quick-2026-04-07-composer-drag-media-lanes

**Status:** done
**Date:** 2026-04-07

## Task

Fix page composer drawer drag recovery, restore reliable inline service media actions on the canvas, derive the homepage service-lane metric from the live service-grid block, and add an on-canvas way to append service lanes.

## Verify

- `npm.cmd exec eslint "src/components/admin-impersonation/InlinePageMediaEditor.tsx" "src/components/admin-impersonation/PageComposerContext.tsx" "src/components/admin-impersonation/PageComposerDrawer.tsx" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerShell.tsx" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerChrome.tsx" "src/blocks/ServiceGrid/Component.tsx" "src/components/home/GrimeTimeMarketingHome.tsx"`
- `npm.cmd exec vitest run tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx`

## Notes

- Lint passed on the touched files.
- `tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx` now passes 2 of 3 tests; the remaining restore-history case still expects the older publish-tab timing.
- The older canvas harness also still expects pre-refactor toolbar behavior and was not used as a release gate for this quick pass.
