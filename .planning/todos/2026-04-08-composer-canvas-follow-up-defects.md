# Todo: composer-canvas-follow-up-defects

**Captured:** 2026-04-08
**Area:** ui / composer / cms
**Urgency:** normal

## What

Fix the remaining visual composer defects discovered after the layout-first page model rollout:

1. Replacing a hero does not show up as replaced in the draft canvas until publish.
2. The composer canvas bar is missing on some CMS pages such as `/contact`.
3. When a block is selected for replacement, the block finder disappears too early and hero blocks do not expose their block data consistently in the selected-block panel.

## Why

These issues break the "edit and verify directly on the live canvas" workflow and make block replacement feel unreliable.

## Context

- The layout-first migration now treats hero and service estimator as real layout blocks.
- Homepage hero presets are split again in the block library, but the surrounding composer UX still has draft-selection and replacement-state gaps.
- App blocks are expected to remain code-owned and should not expose generic block-data editing the same way content blocks do.

## Suggested next action

Debug the draft replacement flow and canvas-toolbar visibility path together, then tighten selected-block behavior so content blocks retain block-finder and replace affordances while app blocks stay custom.
