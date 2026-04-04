---
title: Composer + Copilot UX
description: Docking and visibility requirements for copilot when composer/content tab is open.
---

# Composer/Copilot UX Requirements

## Current behavior
- Copilot launches from “Ask Copilot” in the Content tab but renders behind the visual composer modal.  
- Composer takes the full viewport; copilot cannot be dragged/docked so it remains hidden.

## Desired behavior
1. Copilot panel should float beside or within the composer canvas (left gutter), leaving room for composer controls on the right.  
2. Allow drag/dock behavior similar to the admin impersonation drawer (snap to edges, minimize).  
3. Composer overlay should not cover the copilot; z-index should favor composer background but keep copilot accessible.

## Tracking data
- Document the composer state (tabs, sections) and copilot position in a shared UI store so we can render the panel consistently.  
- Add a flag (`copilotDocked`) per admin session to persist position.

## Next question
- Do we prefer the copilot to auto-dock on the left gutter or be free-floating until the admin attaches it?  

