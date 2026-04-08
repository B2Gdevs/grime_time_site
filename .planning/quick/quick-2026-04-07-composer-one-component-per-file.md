# Quick: quick-2026-04-07-composer-one-component-per-file

**Status:** done
**Date:** 2026-04-07

## Task

Refactor the page composer canvas and drawer so each named component lives in its own file while keeping `PageComposerCanvas`, `CanvasViewportShell`, and `PageComposerDrawer` as the orchestration entrypoints and preserving behavior.

## Follow-up Pass

- Extracted `PageComposerLauncherButton` out of `PageComposerDrawer.tsx` so the drawer file no longer exports UI entrypoints and controller logic from the same module.
- Split `CanvasViewportModeStrip` into dedicated viewport-mode option, trigger, and menu-item files so the mode picker is composed from leaf pieces instead of inline menu markup.
- Split `PageComposerDrawerBlockLibrary` into dedicated header, filters, block-definition card, reusable preset card, shared section card, and shared block-library types files so the main block library reads as orchestration only.

## Verify

- `npm.cmd exec eslint "src/components/admin-impersonation/PageComposerCanvas.tsx" "src/components/admin-impersonation/page-composer-canvas/*.tsx" "src/components/admin-impersonation/PageComposerDrawer.tsx" "src/components/admin-impersonation/page-composer-drawer/*.tsx" "tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx" "tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx"`
- `npm.cmd exec vitest run tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx`
- `npm.cmd exec eslint "src/components/admin-impersonation/PageComposerDrawer.tsx" "src/components/admin-impersonation/PageComposerLauncherButton.tsx" "src/components/admin-impersonation/ContentAuthoringToolbar.tsx" "src/components/admin-impersonation/page-composer-canvas/CanvasViewportModeStrip.tsx" "src/components/admin-impersonation/page-composer-canvas/CanvasViewportModeOptions.ts" "src/components/admin-impersonation/page-composer-canvas/CanvasViewportModeTrigger.tsx" "src/components/admin-impersonation/page-composer-canvas/CanvasViewportModeMenuItem.tsx" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerBlockLibrary.tsx" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerBlockLibraryTypes.ts" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerBlockLibraryHeader.tsx" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerBlockLibraryFilters.tsx" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerBlockDefinitionCard.tsx" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerReusablePresetCard.tsx" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerSharedSectionCard.tsx"`
