# Quick: quick-2026-04-07-canvas-section-shell-declarative

**Status:** done
**Date:** 2026-04-07

## Task

Refactor the page composer canvas section shell into smaller named components while preserving behavior.

## Verify

- `npm.cmd exec eslint "src/components/admin-impersonation/page-composer-canvas/CanvasSectionShell.tsx" "src/components/admin-impersonation/page-composer-canvas/CanvasSectionChrome.tsx" "src/components/admin-impersonation/page-composer-canvas/CanvasPrimitives.tsx" "src/components/admin-impersonation/page-composer-canvas/CanvasViewportShell.tsx" "tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx"`
- `npm.cmd exec vitest run tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx`
