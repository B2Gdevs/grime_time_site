# Quick: quick-2026-04-07-composer-block-launcher-shell

**Status:** done
**Date:** 2026-04-07

## Task

Refactor the page composer drawer into a thinner shell/chrome structure, rename the content surface into a blocks launcher, and keep inline content editing on the live canvas.

## Verify

- `npm.cmd exec eslint "src/components/admin-impersonation/PageComposerDrawer.tsx" "src/components/admin-impersonation/page-composer-drawer/*.tsx" "src/components/admin-impersonation/PageComposerContext.tsx" "src/components/admin-impersonation/PageComposerInlineText.tsx" "tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx"`
- `npm.cmd exec vitest run tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx`
