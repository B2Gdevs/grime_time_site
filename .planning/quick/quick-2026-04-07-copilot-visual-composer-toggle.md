# Quick: quick-2026-04-07-copilot-visual-composer-toggle

**Status:** done
**Date:** 2026-04-07

## Task

Replace the copilot tools panel's `Open content tools` action with a single `Visual composer` switch that toggles the live page composer for the current route, restore the `Visual composer` label to the live page composer bar, and swap the copilot header hide action to an icon close control in the top-right corner.

## Verify

- `npm.cmd exec eslint src/components/admin-impersonation/SiteOperatorToolsPanel.tsx src/components/copilot/PortalCopilot.tsx tests/int/components/admin-impersonation/site-operator-tools-panel.int.spec.tsx tests/int/components/copilot/portal-copilot-composer-tab.int.spec.tsx`
- `npm.cmd exec vitest run tests/int/components/admin-impersonation/site-operator-tools-panel.int.spec.tsx tests/int/components/copilot/portal-copilot-composer-tab.int.spec.tsx`
