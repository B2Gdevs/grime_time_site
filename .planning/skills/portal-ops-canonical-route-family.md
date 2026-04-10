---
name: portal-ops-canonical-route-family
description: >-
  Keep Grime Time staff routes canonical under `/portal/ops/*` while preserving
  legacy `/ops/*` URLs as compatibility redirects. Use this when adding new
  staff portal pages, nav links, deep links, tour paths, or staff-only route
  detection so route intent stays explicit without breaking old links.
---

# Portal ops canonical route family

## When to use
- You are adding or renaming any staff-facing portal route.
- You see new code hardcoding `/ops/...` links outside compatibility redirects.
- Staff-only route checks, tour links, or deep-link builders need to recognize both canonical and legacy paths.

## The pattern
- Put canonical staff routes under `/portal/ops/*`.
- Keep legacy `/ops/*` pages as thin redirects to the canonical path.
- Centralize path constants and route classification in `src/lib/navigation/portalPaths.ts`.
- Use shared helpers like `OPS_WORKSPACE_PATH`, `OPS_USERS_PATH`, `OPS_CUSTOMERS_PATH`, `isOpsPortalPath()`, and `isOpsWorkspacePath()` instead of string prefixes.
- Update every emitted link source, not just the page files:
  - sidebar/nav
  - query-string builders
  - tours
  - staff-only chrome checks
  - notification emails
  - live-route guards
  - focused tests

## Why
The failure mode is mixed contracts: some code treats `/ops/*` as the real app, while other code uses `/portal/ops/*`. That breaks route detection, deep links, and staff-only UI conditions in subtle ways even when the page itself exists. The stable pattern is one canonical family plus redirect-only legacy pages, with all callers going through shared path helpers.

## Failure modes
- If you only move the page files, nav and tour links still emit legacy URLs and the contract drifts again.
- If staff-route detection still checks `pathname.startsWith('/ops')`, canonical `/portal/ops/*` pages lose staff chrome or protections.
- If compatibility redirects are removed too early, deployed emails, bookmarks, and copied links break.
- If tests only cover one path family, regressions slip in when another helper still emits the old route.

## Related
- `staff-admin-clerk-role-preservation`
