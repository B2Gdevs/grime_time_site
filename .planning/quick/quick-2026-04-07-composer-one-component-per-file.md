# Quick: quick-2026-04-07-composer-one-component-per-file

**Status:** done
**Date:** 2026-04-07

## Task

Refactor the drawer composer tab and card surfaces so each named component lives in its own file while keeping `PageComposerDrawer` as the orchestrator and preserving behavior.

## Verify

- `npm.cmd exec eslint "src/components/admin-impersonation/PageComposerDrawer.tsx" "src/components/admin-impersonation/page-composer-drawer/*.tsx" "tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx"`
- `npm.cmd exec vitest run tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx`
