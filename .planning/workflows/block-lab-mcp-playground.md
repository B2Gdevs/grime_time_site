# Block lab: staff playground + MCP App Studio (phase 20)

## Problem

- Payload blocks under `src/blocks/` are wired for **production pages** and **composer** contexts. New blocks need **isolated iteration** with **mock data** without publishing pages or exposing WIP to visitors.
- We also want to experiment with **MCP-hosted UI** (keywords, tool triggers, one-block-at-a-time previews) using [MCP App Studio](https://www.assistant-ui.com/mcp-app-studio) so the same visual language can surface inside AI clients.

## Goals (requirements sketch)

### A — Staff-only Next route (optional complement)

- A **non-indexed** admin/staff route (e.g. `/internal/block-lab` or under `/portal/ops/…`) that:
  - Requires **membership-aware staff** auth (same bar as ops routes).
  - Renders a **registry grid** of blocks with **fixture props** (JSON or TS fixtures), not live CMS pages.
  - Is **never** linked from public nav or sitemap; `noindex` meta.
- **Does not** replace MCP studio for host-specific behavior; it is the fastest “browser-only” loop when you are not running Claude/ChatGPT.

### B — MCP App Studio app (primary experiment track)

- A **sibling package** under `tools/grime-block-lab/` created with:

  ```bash
  cd vendor/grime-time-site/tools
  npx mcp-app-studio grime-block-lab
  ```

  The CLI is **interactive** (e.g. app description prompt). Complete prompts locally; commit the generated project afterward.

- **Hot reload**, **mock tool responses**, and **export** (`export/widget/`, `manifest.json`) per [MCP App Studio](https://www.assistant-ui.com/mcp-app-studio) docs.
- **Block switching**: if the host shows **one widget at a time**, expose an MCP tool such as `set_preview_block` / `list_blocks` so the model (or a dev toolbar) can change the active block id and props JSON.

### C — Code sharing (ecosystem constraint)

- Many blocks import `@/…` (components, utilities, Payload types). The MCP bundle **cannot** blindly alias `src/` without resolving those paths and server-only imports.
- **Phased approach**:
  1. **Thin previews**: duplicate minimal prop interfaces + presentational subset in the lab app for new WIP blocks (fastest).
  2. **Extract**: move shared **presentational** pieces to `src/blocks/_shared/` or a future workspace package once a block stabilizes.
  3. **Story-style fixtures**: one fixture file per `blockType` mirroring `payload-types` shapes (depth-0 mocks).

### D — What “playgrounds” usually include

| Capability | Next staff lab | MCP studio |
|------------|----------------|------------|
| Fixture / variant switcher | ✅ tabs or sidebar | ✅ tool calls + mock JSON |
| Responsive breakpoints | ✅ | ✅ (studio preview modes) |
| Dark/light | optional | host-dependent |
| A11y spot check | ✅ | limited |
| “Keyword → block” routing | N/A | ✅ experiment surface |
| No deploy to iterate | ✅ local only | ✅ local + export when ready |

## Out of scope (for first slice)

- Public customers using the lab.
- Replacing Storybook entirely (we are **not** adding Storybook unless decided later).
- Auto-syncing every block from Payload CMS into the lab (manual fixtures first).

## References

- MCP App Studio: https://www.assistant-ui.com/mcp-app-studio  
- Workbench demo: https://mcp-app-studio-starter.vercel.app  
- Block registry entry point: `src/blocks/RenderBlocks.tsx`
