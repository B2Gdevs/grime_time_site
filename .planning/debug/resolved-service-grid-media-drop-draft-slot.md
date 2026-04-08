# Debug: service-grid-media-drop-draft-slot

**Status:** resolved
**Started:** 2026-04-07
**Resolved:** 2026-04-07

## Symptoms

- Expected: media dragged from the composer media tab should light up service-lane media targets, show the hover actions, and render immediately in the selected services section lane.
- Actual: service lanes inside the services section showed no hover affordances, would not accept media drags from the library, and did not render draft-assigned media.
- Reproduction: open the page composer, select a service-grid block, drag a media item from the media tab onto a service lane, and observe that the lane stays inert.
- Timeline: regression surfaced during the composer refactor and auto-draft workflow updates on 2026-04-07.

## Hypotheses

| # | Hypothesis | Likelihood | How to test |
|---|-----------|-----------|-------------|
| 1 | `InlinePageMediaEditor` only enables itself when the route-level media registry already contains the exact `layout.<block>.services.<row>.media` entry, so draft-only service lanes go inert. | High | Inspect `InlinePageMediaEditor` and compare its gate with the route registry bridge data source. |
| 2 | `ServiceGridBlock` still renders lane media from stale block props instead of the selected draft block in `serviceGridEditor.block`. | High | Inspect service-grid rendering and compare the row/media source to the draft editor state. |
| 3 | The drag payload from the media tab is malformed for service-grid slots. | Low | Verify the drag MIME helper and the drawer media card drag setup. |

## Investigation log

- Confirmed the media tab already emits the expected drag payload via `application/x-page-composer-media-id`.
- Confirmed `InlinePageMediaEditor` returned plain children whenever `currentPage.entries` did not contain an exact `relationPath` match, which removes hover chrome and drop handlers entirely.
- Confirmed the page media registry bridge is populated from the frontend route payload, not the unsaved local draft tree, so newly added or locally changed service lanes can be missing from the registry.
- Confirmed `ServiceGridBlock` interactive rendering was still sourcing media from the incoming block props instead of the active `serviceGridEditor.block` draft rows.

## Root cause

**Confirmed:** two coupled draft-state gaps caused the regression.

1. `InlinePageMediaEditor` depended on the route registry entry existing before it would activate, but draft-only service-grid slots are not guaranteed to exist in that registry yet.
2. `ServiceGridBlock` rendered lane media from stale props instead of the selected draft block, so even valid draft media assignments could fail to appear on the live canvas.

## Fix

- Added a draft-aware fallback media entry builder in `src/components/admin-impersonation/InlinePageMediaEditor.tsx` so service-grid media slots stay interactive even when the route registry is stale or incomplete.
- Updated `src/blocks/ServiceGrid/Component.tsx` to prefer the live `serviceGridEditor.block` data for headings, rows, and media while the selected block is being edited.
- Added regression coverage in:
  - `tests/int/components/admin-impersonation/inline-page-media-editor.int.spec.tsx`
  - `tests/int/blocks/service-grid-inline-editing.int.spec.tsx`

## Verification

- `npm.cmd exec eslint "src/components/admin-impersonation/InlinePageMediaEditor.tsx" "src/blocks/ServiceGrid/Component.tsx" "tests/int/blocks/service-grid-inline-editing.int.spec.tsx" "tests/int/components/admin-impersonation/inline-page-media-editor.int.spec.tsx"`
- `npm.cmd exec vitest run tests/int/blocks/service-grid-inline-editing.int.spec.tsx tests/int/components/admin-impersonation/inline-page-media-editor.int.spec.tsx`
