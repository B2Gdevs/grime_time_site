# Quick: quick-2026-04-07-current-route-composer-source-of-truth

**Status:** done
**Date:** 2026-04-07

## Task

Make the current frontend route the source of truth for the visual composer: remove the page picker, return a draft seed when the route has no page document yet, let the `[slug]` frontend route render an admin/content-author shell instead of falling straight into the normal 404 path, and create the page document on first save/publish from that route.

## Verify

- `npm.cmd exec eslint src/lib/pages/pageComposer.ts src/app/api/internal/page-composer/route.ts "src/app/(frontend)/[slug]/page.tsx" src/components/admin-impersonation/PageComposerContext.tsx src/lib/ai/types.ts src/lib/ai/copilotAuthoring.ts src/components/admin-impersonation/PageComposerDrawer.tsx src/components/admin-impersonation/PageComposerCanvas.tsx tests/int/lib/pages/page-composer.int.spec.ts tests/int/app/page-composer-route.int.spec.ts tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx tests/e2e/page-composer.e2e.spec.ts tests/helpers/login.ts`
- `npm.cmd exec vitest run tests/int/lib/pages/page-composer.int.spec.ts tests/int/app/page-composer-route.int.spec.ts tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx`
- browser smoke attempt: `npm.cmd exec -- playwright test tests/e2e/page-composer.e2e.spec.ts -g "can start composing and create a draft directly from a missing route" --config=playwright.config.ts` currently blocked by pre-existing Next/ops-shell issues outside this patch (generated route-types build failure on `next build`, admin login hydration mismatch on the Payload shell, and a missing `AuiProvider` runtime error on the live canvas path when forcing the copilot shell off)
