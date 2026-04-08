# Todo: cms-route-gating-and-block-actions

**Captured:** 2026-04-08
**Area:** ui / composer / routing
**Urgency:** high

## What

Tighten the visual composer so it only appears on CMS-managed page routes, remove the leftover custom `/contact` frontend page in favor of the CMS page document, and add direct selected-block management actions inside the Block data tab.

## Why

- The composer should not appear on non-CMS routes such as auth, search, or other code-owned frontend pages.
- `/contact` must be owned by the CMS page model instead of a conflicting custom route.
- Authors need to remove the current block or insert a new block below from the same selected-block surface without switching back to the structure tab.

## Suggested next action

Reserve known non-CMS frontend slugs in the composer path helpers, hide composer UI on ineligible routes, delete the `_contact` route, and extend the selected-block panel with add-below and remove actions.

## Resolution

Resolved on 2026-04-08.

- Composer route detection now excludes reserved non-CMS frontend paths, so the floating launcher and live canvas tooling only appear on CMS-managed pages.
- The leftover custom `_contact` frontend page was deleted so `/contact` is owned by the CMS page document again.
- The selected-block panel now includes `Add below` and `Remove block`, while keeping `Find blocks` available for replace flows.
