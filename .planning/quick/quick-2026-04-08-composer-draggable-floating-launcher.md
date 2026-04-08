# Composer: draggable floating launcher (Site Copilot pattern)

## Done

- `PageComposerFloatingLauncher`: bottom-right draggable chip (motion + `localStorage` position), same click-vs-drag guard as portfolio Site Copilot.
- **Closed:** pill “Page composer” opens the session.
- **Minimized:** round **settings** icon expands the panel (`setPanelMinimized(false)`).
- `PageComposerDrawerShell`: `AnimatePresence` exit when minimizing; enter when expanding.
- Launcher mounts from `PageComposerDrawer` (shared `enabled` gate); `ContentAuthoringToolbar` is a no-op to avoid duplicate launchers.

## Verify

- `npm exec vitest run tests/int/components/admin-impersonation/page-composer-shell.int.spec.tsx`
