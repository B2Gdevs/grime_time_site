# Debug: page-composer-auto-draft-canvas-bar

**Status:** resolved
**Started:** 2026-04-07
**Resolved:** 2026-04-07

## Symptoms

- Expected: opening or editing a published page in the frontend composer should keep the live canvas bar visible and let draft autosave run in the background without interrupting editing.
- Actual: the new auto-draft path could move the editor onto a new draft route or push a new route during draft saves, which made the canvas toolbar disappear because the canvas only renders chrome when the active composer route matches the current pathname.

## Hypotheses

| # | Hypothesis | Likelihood | How to test |
|---|-----------|-----------|-------------|
| 1 | Opening a published page now auto-clones to a new draft route and breaks the canvas route match. | High | Inspect `PageComposerDrawer.loadComposer` and verify whether published pages call `clone-page` plus `router.push`. |
| 2 | Debounced `save-draft` still pushes route changes when the draft slug changes, so autosave clears the canvas bar mid-edit. | High | Inspect `persistPage`, then verify whether `save-draft` calls `router.push` when the returned `pagePath` differs from `pathname`. |
| 3 | The canvas bar itself regressed in markup during refactor. | Medium | Run the canvas integration test and inspect the rendered output. |

## Investigation Log

- Confirmed the canvas chrome still renders in tests, but the integration test expectations were stale after the toolbar refactor.
- Confirmed `PageComposerDrawer.loadComposer` auto-called `clone-page` for published pages and pushed to the clone route.
- Confirmed `persistPage` pushed route changes for any save response, including debounced `save-draft`.
- Confirmed the canvas toolbar event only stays active when `composerActivePagePath === pathname`, so either route change path would blank the bar during editing.

## Root Cause

The new draft flow mixed two concepts:

1. creating an isolated clone route for a published page, and
2. lightweight draft autosave for in-place editing.

Because the canvas bar only renders for the current route, the clone-route jump and generic save-time `router.push` both broke the route match and made the canvas chrome disappear.

## Fix

- Stop auto-cloning published pages on composer load.
- Keep draft autosave on the current page document.
- Prevent `save-draft` from pushing a new route; only `publish-page` is allowed to navigate.
- Preserve the current pathname in local draft state during draft saves so the live canvas keeps the right source-of-truth route while editing.

## Verification

- `npm.cmd exec eslint "src/components/admin-impersonation/PageComposerContext.tsx" "src/components/admin-impersonation/PageComposerDrawer.tsx" "tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx" "tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx" "tests/e2e/page-composer.e2e.spec.ts"`
- `npm.cmd exec vitest run tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx`
