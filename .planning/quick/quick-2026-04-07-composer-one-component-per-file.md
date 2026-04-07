# Quick: quick-2026-04-07-composer-one-component-per-file

**Status:** done
**Date:** 2026-04-07

## Task

Refactor the remaining page composer canvas and drawer chrome/tab surfaces so each named component lives in its own file while preserving the existing public wrappers, shell layers, and behavior.

## Verify

- `npm.cmd exec eslint "src/components/admin-impersonation/PageComposerCanvas.tsx" "src/components/admin-impersonation/page-composer-canvas/*.tsx" "src/components/admin-impersonation/PageComposerDrawer.tsx" "src/components/admin-impersonation/page-composer-drawer/*.tsx" "tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx" "tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx"`
- `npm.cmd exec vitest run tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx`
- `npm.cmd exec eslint "src/components/admin-impersonation/PageComposerCanvas.tsx" "src/components/admin-impersonation/page-composer-canvas/*.tsx" "tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx"`
- `npm.cmd exec vitest run tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx`
