---
title: Composer + Copilot UX
description: Docking and visibility requirements for copilot when composer/content tab is open.
---

# Composer/Copilot UX Requirements

## Current behavior
- Copilot launches from "Ask Copilot" in the Content tab but renders behind the visual composer modal.
- Composer takes the full viewport; copilot cannot be dragged or docked so it remains hidden.

## Product goal

Keep the visual composer and copilot in one usable workspace instead of forcing the admin to choose between editing and AI help. The copilot should assist the selected page or block without obscuring composer controls.

## Required behavior

1. Copilot panel should dock beside the composer, preferably in a left gutter, while the composer keeps structure/content/media controls on the right.
2. The user should be able to toggle between docked and floating modes.
3. The composer overlay must never fully cover the copilot when the session was opened from the composer.
4. Selected page, block, and focused media context must remain visible to the copilot while docked.
5. Closing the composer should either keep the copilot open in normal mode or restore the previous copilot state cleanly.

## Layout rules

- Default dock target: left side of the viewport.
- Composer drawer remains on the right.
- On narrower widths, the docked copilot should collapse into a tabbed or stacked mode instead of sitting behind the composer.
- Z-index rules should ensure:
  - page content stays at the back
  - docked copilot and composer both remain interactive
  - transient modals from either surface appear above both panes without breaking focus handling

## Tracking data
- Document the composer state (tabs, sections) and copilot position in a shared UI store so we can render the panel consistently.
- Add a flag (`copilotDocked`) per admin session to persist position.
- Track:
  - docked vs floating mode
  - side preference
  - width
  - minimized state
  - whether the session originated from the composer or the normal site shell

## Interaction notes

- "Ask Copilot" from the composer should open in docked mode by default.
- Dragging the panel away should switch to floating mode without losing authoring context.
- Returning to docked mode should preserve the current conversation and focused authoring state.
- Composer save, publish, and block-selection events should update the shared context without forcing a copilot remount.

## Open question resolved for planning

Default to auto-dock on the left gutter when launched from the composer. Free-floating remains an explicit user override, not the default.

## Follow-on implementation pointer

This planning slice should feed the next composer stream after phase `15`:

- shared UI state between composer and copilot
- left-gutter docked rendering
- responsive fallback on narrow screens
- z-index and focus-management fixes across both panes
