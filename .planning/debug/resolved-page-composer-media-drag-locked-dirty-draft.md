# Debug: page-composer-media-drag-locked-dirty-draft

**Status:** resolved
**Started:** 2026-04-07
**Resolved:** 2026-04-07

## Symptoms

- Expected: dragging a media tile from the composer media tab onto hero and service-grid media slots should show an active drop target and stage the media into the current page draft.
- Actual: no drag/drop indication appeared on hero or service-grid slots, and dropping from the media tab did not assign media during normal draft editing.
- Reproduction: open the page composer, make draft edits so autosave/debounce is active, then drag a media tile from the media tab onto a canvas media slot.

## Hypotheses

| # | Hypothesis | Likelihood | How to test |
|---|-----------|-----------|-------------|
| 1 | The media library card drag source is disabled whenever the draft is dirty, so drag events never begin. | High | Inspect `PageComposerDrawer.tsx` and `PageComposerDrawerMediaLibraryCard.tsx` for `dirty`-based drag locking. |
| 2 | The drop target is still inert because the slot registry misses draft-only service lanes. | Medium | Verify `InlinePageMediaEditor` fallback entry behavior on hero and service-grid slots. |
| 3 | Even if drag is enabled, the slot assignment path bypasses local draft state and gets overwritten by autosave. | High | Trace `InlinePageMediaEditor` media swap handling versus `persistPage('save-draft')`. |

## Investigation log

- Confirmed `PageComposerDrawer` computed `mediaActionsLocked = dirty || !draftPage || typeof draftPage.id !== 'number'`.
- Confirmed `PageComposerDrawerMediaLibraryCard` used that same lock to set `draggable={false}`, so a dirty draft prevented drag from starting at all. This matched the user report that hero was also dead.
- Confirmed `InlinePageMediaEditor` drag/drop previously posted directly to `/api/internal/page-composer/media`, which bypassed the local composer draft tree.
- Confirmed the slot-level `Replace` action incorrectly reused the focused copilot media workflow, so clicking replace opened chat instead of the composer media lane.
- Confirmed `onOpenMediaSlot(relationPath)` ignored the incoming relation path, so the media tab could not focus the exact slot that initiated replace.
- Confirmed autosave persists the entire local `draftPage`, so a slot change applied outside draft state can be reverted by the next debounced save.
- Confirmed the main page save pipeline already normalizes `service.media` and `hero.media` object relations to ids, so staging a dropped media document inside `draftPage` is compatible with autosave.

## Root cause

**Confirmed:** two linked behaviors caused the failure.

1. Drag from the media library was hard-disabled whenever the composer was dirty, which is a normal state during debounced draft editing.
2. The drop handler’s old direct-to-API swap path bypassed local draft state, so simply unlocking drag would have reintroduced autosave overwrite races.
3. Slot `Replace` was routed through the copilot-focused workflow instead of the composer media tab, and slot focus was not preserved into the media drawer.

## Fix

- Kept media-library hover actions locked when needed, but split drag availability from that lock so tiles remain draggable during dirty/autosave states.
- Expanded the drag payload to include the dragged media document.
- Changed `InlinePageMediaEditor` to stage dropped library media into the local draft through the composer toolbar state, letting autosave persist the relation like any other draft edit.
- Routed slot `Replace` to the composer media tab only, without opening copilot, and preserved the exact clicked relation path so hero/media-block/service-row replacements stay focused on the correct slot.
- Added stronger drag-active slot visuals so a valid drop target is obvious during drag.

## Verification

- `npm.cmd exec eslint "src/components/admin-impersonation/InlinePageMediaEditor.tsx" "src/components/admin-impersonation/PageComposerContext.tsx" "src/components/admin-impersonation/PageComposerDrawer.tsx" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaTypes.ts" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerTypes.ts" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaLibraryCard.tsx" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerMediaTab.tsx" "src/components/admin-impersonation/page-composer-drawer/PageComposerDrawerChrome.tsx" "src/lib/pages/pageComposerMediaDrag.ts" "src/app/api/internal/page-composer/media/route.ts" "tests/int/components/admin-impersonation/inline-page-media-editor.int.spec.tsx" "tests/int/components/admin-impersonation/page-composer-media-library-card.int.spec.tsx" "tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx"`
- `npm.cmd exec vitest run tests/int/components/admin-impersonation/inline-page-media-editor.int.spec.tsx tests/int/components/admin-impersonation/page-composer-media-library-card.int.spec.tsx tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx tests/int/blocks/service-grid-inline-editing.int.spec.tsx`
