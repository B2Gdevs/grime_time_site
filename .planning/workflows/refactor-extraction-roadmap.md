# Refactor extraction roadmap and target folder structure

**Owner:** Engineering  
**Last reviewed:** 2026-03-26  
**Audience:** Implementation planning for modularization, reuse, and maintainability.

## Purpose

Define the target architecture we are navigating toward while shipping features, and provide a prioritized extraction queue.

## Target folder structure (north star)

```txt
src/
  app/
    (portal)/
      ops/
        page.tsx                  # "My duties" summary hub
        crm/page.tsx              # dedicated CRM workspace
        today/page.tsx            # day board
        scorecard/page.tsx
        milestones/page.tsx
        assets/page.tsx
  lib/
    auth/
      context/
        getAuthContext.ts
        presentNavContext.ts
    crm/
      schema.ts                   # shared options (already present)
      uiMeta.ts                   # status badges/icons/labels
      workspace/
        queries.ts
        actions.ts
        presenters/
          queueItemPresenter.ts
          detailPresenter.ts
        query/
          parseCrmQuery.ts
          stringifyCrmQuery.ts
    ops/
      loaders/
        loadOpsDashboardData.ts
        loadScorecardData.ts
      presenters/
        opsCardsPresenter.ts
        scorecardPresenter.ts
      policies/
        projectionPolicy.ts
        slaPolicy.ts
      query/
        parseOpsQuery.ts
        stringifyOpsQuery.ts
    dashboard/
      types.ts
      presenters/
        customerCards.ts
        opsCards.ts
  components/
    portal/
      shared/
        StatusBadge.tsx
        SectionHeader.tsx
        EmptyState.tsx
```

## Current-to-target migration strategy

1. Keep behavior stable; extract logic before route splitting where practical.
2. Introduce shared presenters/policies first, then redirect pages/components to them.
3. Split `/ops` into `/ops/*` once typed query-param utilities exist.
4. Move visual metadata and status/icon mappings into shared config-driven modules.
5. Convert command center into current-user duties shell with deep links to `/ops/*`.

## Priority extraction queue (first 10)

1. `src/app/(portal)/ops/page.tsx` -> split data loaders and presenters. **Progress:** dashboard data + KPI assembly moved to `src/lib/ops/loaders/loadOpsDashboardData.ts`; route file now uses `src/lib/ops/loaders/loadOpsRouteData.ts` for shared admin gating and data loading.
2. `src/components/portal/AdminDashboardView.tsx` -> extract operator panel config + shared panel components.
3. `src/components/app-sidebar.tsx` -> extract nav context/label builder (admin vs preview user). **Progress:** staff-route shell + `(admin)` / `(test_user)` labels + `previewIdentity` + `portalNavSurface` hook, plus shared nav config builders in `src/lib/navigation/portalSidebar.ts`.
4. `src/lib/auth/getAuthContext.ts` + auth callers -> centralize preview context presenter.
5. `src/lib/crm/workspace/format.ts` -> convert to presenter/meta driven formatting.
6. `src/components/portal/crm/CrmWorkspace.tsx` -> move queue/action metadata and query handling into shared modules.
7. `src/components/admin-impersonation/AdminImpersonationToolbar.tsx` -> extract search/result row and quick-link config.
8. `src/app/(portal)/dashboard/page.tsx` -> extract customer cards presenter.
9. `/ops` route query logic -> add typed parser/serializer utilities for deep links. **Progress:** implemented in `src/lib/ops/query/parseOpsQuery.ts` and `src/lib/ops/query/stringifyOpsQuery.ts`, re-exported by `src/lib/ops/opsCommandCenterTabs.ts`.
10. shared status badge/icon metadata -> centralized `uiMeta` modules for CRM/ops/customer areas. **Progress:** ops section labels, icons, route metadata, and default detail copy now live in `src/lib/ops/uiMeta.ts`.

## Recent completed/partial extractions

- `src/app/(portal)/layout.tsx` now delegates shell composition to `src/components/portal/PortalAppShell.tsx`.
- `/ops/crm`, `/ops/today`, `/ops/scorecard`, `/ops/milestones`, and `/ops/assets` are now real focused pages instead of redirects, using `src/components/portal/ops/OpsSectionPage.tsx` and `src/components/portal/ops/OpsFocusedWorkspace.tsx`.
- CRM task creation now flows through shared policy/data modules in `src/lib/crm/tasks/policy.ts` and `src/lib/crm/tasks/data.ts` instead of route/hook-local condition chains.
- Billing workspace composition now uses focused subcomponents under `src/components/portal/ops/billing/` instead of a single monolithic workspace card.

## Reuse goals

- Increase reusable logic/components from ~50% to >=70% across ops/customer surfaces.
- Eliminate duplicated status/stage mappings across files.
- Keep new feature files under guardrail thresholds from conventions doc.

## Definition of done for each extraction slice

- No behavior regression for customer/admin boundaries.
- Typed interfaces for new presenter/policy modules.
- At least one literal/mapping duplication removed.
- Routes/components consuming extracted utility are updated in same slice.
