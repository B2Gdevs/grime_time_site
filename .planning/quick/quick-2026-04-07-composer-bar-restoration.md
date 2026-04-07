# Quick: quick-2026-04-07-composer-bar-restoration

**Status:** done
**Date:** 2026-04-07

## Task

Remove the embedded page composer from the copilot tools pane, restore the live top composer bar controls and label, and keep the copilot close control in the top-right corner of the shell.

## Verify

- `npm.cmd exec eslint src/components/admin-impersonation/SiteOperatorToolsPanel.tsx src/components/admin-impersonation/PageComposerCanvas.tsx src/components/admin-impersonation/PageComposerDrawer.tsx src/components/copilot/PortalCopilot.tsx tests/int/components/admin-impersonation/site-operator-tools-panel.int.spec.tsx tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx tests/int/components/copilot/portal-copilot-composer-tab.int.spec.tsx`
- `npm.cmd exec vitest run tests/int/components/admin-impersonation/site-operator-tools-panel.int.spec.tsx tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx tests/int/components/copilot/portal-copilot-composer-tab.int.spec.tsx`
