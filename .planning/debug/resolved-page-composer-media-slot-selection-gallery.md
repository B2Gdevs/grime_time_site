# Debug: page-composer-media-slot-selection-gallery

**Status:** resolved
**Started:** 2026-04-07
**Resolved:** 2026-04-07

## Symptoms

- Expected: clicking a hero or service-lane media area on canvas should focus that exact slot in the composer media tab, and `Use this media` should assign from the main gallery without relying on the separate recent-media panel.
- Actual: OS file drops worked, but internal gallery placement still felt unreliable for service lanes. The media tab still surfaced `Recent media`, while the main gallery lacked the direct assignment action the operator wanted.
- Reproduction: open the composer, click a service-lane media area, switch to Media, then try to reuse an existing gallery item for that lane.

## Hypotheses

| # | Hypothesis | Likelihood | How to test |
|---|-----------|-----------|-------------|
| 1 | `onOpenMediaSlot(relationPath)` stores the relation path but does not select the block that owns it, so the media tab resolves slots from the wrong block. | High | Trace `PageComposerDrawer.tsx` slot selection and invoke `onOpenMediaSlot` against a non-selected service grid lane. |
| 2 | The gallery is still wired around the `Recent media` helper instead of the main library grid, so assignment is available in the wrong surface. | High | Inspect `PageComposerDrawerMediaTab.tsx` and `PageComposerDrawerRecentMediaLibrary.tsx`. |
| 3 | Canvas media regions are not selectable unless drag-and-drop succeeds. | Medium | Verify whether clicking `InlinePageMediaEditor` opens the slot workflow directly. |

## Investigation log

**H1 test:** confirmed. `PageComposerDrawer.tsx` was setting `selectedMediaPath` and switching to the media tab, but it was not updating `selectedIndex` from the relation path. Service-lane requests like `layout.1.services.1.media` could open the media tab while the selected block still pointed somewhere else.

**H2 test:** confirmed. `PageComposerDrawerMediaTab.tsx` still rendered `PageComposerDrawerRecentMediaLibrary` for assignment, while the real library grid only supported drag, replace, generate, and delete.

**H3 test:** confirmed as an improvement area, not the root cause. `InlinePageMediaEditor.tsx` supported replace/generate buttons, but clicking the media region itself did not focus the slot in the composer.

## Root cause

The service-lane placement flow failed because the composer media tab resolved its target from the currently selected block, while `onOpenMediaSlot(relationPath)` did not retarget the selected block to the block that owned the requested slot. At the same time, direct reuse still lived in the separate `Recent media` panel instead of the main gallery, so the operator could not use the actual library grid as the placement surface.

## Fix

- Parse media relation paths in `PageComposerDrawer.tsx` and update `selectedIndex` before opening the media tab.
- Make `InlinePageMediaEditor.tsx` treat clicks on the canvas media region as slot selection, not just drag/drop or overlay-button actions.
- Remove the recent-media assignment surface from `PageComposerDrawerMediaTab.tsx`.
- Add `Use this media` directly to `PageComposerDrawerMediaLibraryCard.tsx`, targeted at the currently selected slot.
- Add focused tests covering canvas selection, gallery assignment, and service-lane retargeting.

## Verification

- `npm.cmd exec eslint "src/components/admin-impersonation/InlinePageMediaEditor.tsx" "src/components/admin-impersonation/PageComposerDrawer.tsx" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaTab.tsx" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaLibraryCard.tsx" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaSelectedSlotDetails.tsx" "tests/int/components/admin-impersonation/inline-page-media-editor.int.spec.tsx" "tests/int/components/admin-impersonation/page-composer-media-library-card.int.spec.tsx" "tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx"`
- `npm.cmd exec vitest run tests/int/components/admin-impersonation/inline-page-media-editor.int.spec.tsx tests/int/components/admin-impersonation/page-composer-media-library-card.int.spec.tsx tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx`
