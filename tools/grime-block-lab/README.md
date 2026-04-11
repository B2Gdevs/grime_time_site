# Grime Time block lab

Fixture-driven preview workspace for Grime Time blocks using
[MCP App Studio](https://www.assistant-ui.com/mcp-app-studio).

This is intentionally closer to Storybook than to a full MCP app right now:
the goal is fast local iteration with hot reload, mock data, and a visible
registry of block previews. We are not standing up an MCP server in this slice.

## Current slice

- Uses the App Studio workbench as the shell.
- Starts with one pilot block: `service-grid`.
- Drives previews from a typed fixture registry under `lib/fixtures/`.
- Seeds preview-control tools into the mock panel on first load:
  `list_blocks`, `set_preview_block`, and `apply_preview_overrides`.
- Adds a `Live` tab that can refresh one private Grime Time block-lab page
  through the local Payload app and load supported block instances into the
  preview.
- Keeps preview code local to the lab instead of importing the full
  `src/blocks/ServiceGrid/Component.tsx` authoring stack.

## Run it

From this directory:

```bash
npm install
npm run dev
```

Open `http://localhost:3002`.

From `vendor/grime-time-site/`, you can also use:

```bash
npm run block-lab:dev
```

If you want the `Live` tab to connect, also run the main Grime Time app locally
and point `GRIME_TIME_APP_ORIGIN` at it if you are not using `http://127.0.0.1:3000`.
The Grime Time app should contain one private page with slug `block-lab` unless
you override it with `GRIME_TIME_BLOCK_LAB_PAGE_SLUG`.

## How to use the workbench

- Pick `Service Grid` from the component list.
- Use the inline review toolbar to switch fixtures, list the seeded blocks,
  or apply a sample override through the same `callTool()` path the studio
  already exposes.
- Open the `Live` tab in the left panel to refresh real page blocks from the
  local Payload app. The live catalog reads one private page intended to hold
  every block variant you want to review. Supported blocks can be loaded
  directly into the preview as the new base `toolInput`.
- Change `fixtureId` in the JSON editor to `interactive`, `featureCards`, or
  `pricingSteps` when you want the base preview state to move with your manual
  fixture edits.
- Add a `block` object to override fixture values without touching the base
  fixture definition.
- Leave the right-side `widgetState` editor alone unless you want to inspect
  the host-managed overlay directly. The toolbar writes there on purpose so the
  base `toolInput` JSON stays readable.
- Edit the preview component and save; Vite HMR updates the preview frame.

Example input:

```json
{
  "fixtureId": "featureCards",
  "block": {
    "heading": "Waterfront service lanes",
    "services": [
      {
        "id": "dock-wash",
        "name": "Dock wash",
        "summary": "Mock override copy for a focused studio pass.",
        "highlights": [
          { "text": "Swap copy, media, or layout shape without publishing." }
        ]
      }
    ]
  }
}
```

## File map

- `components/blocks/service-grid-preview.tsx`
  Presentational pilot block used by the lab, with an optional toolbar slot.
- `lib/fixtures/service-grid.ts`
  Typed fixture variants and mock media paths.
- `lib/fixtures/block-fixture-registry.ts`
  Registry entry point for block fixtures.
- `lib/workbench/preview-tools.ts`
  Preview-tool schemas, tool result helpers, and fixture-resolution logic.
- `components/workbench/live-block-catalog-panel.tsx`
  Left-panel live catalog that refreshes Payload-backed block data and loads
  supported blocks into the preview.
- `lib/workbench/wrappers/service-grid-sdk.tsx`
  MCP App Studio wrapper that resolves `fixtureId` + overrides and exposes the
  review toolbar.
- `app/api/grime-time/blocks/route.ts`
  Dev-only proxy from the lab to the main Grime Time app's internal block-lab
  route.

## Preview tool payloads

The toolbar uses three seeded mock tools:

- `list_blocks`
  Returns the current preview catalog plus the expected host capability matrix.
- `set_preview_block`
  Returns a `previewState` payload with the selected `fixtureId`.
- `apply_preview_overrides`
  Returns a `previewState` payload with a block override object. The default
  handler applies a visible sample override, but you can replace that payload
  in the mock panel to test custom JSON.

If you want to hand-edit a mock response for `apply_preview_overrides`, the
minimum useful shape is:

```json
{
  "previewState": {
    "blockType": "serviceGrid",
    "fixtureId": "featureCards",
    "block": {
      "heading": "Waterfront service lanes",
      "intro": "Mock panel override copy for a studio review pass."
    }
  }
}
```

## Host expectations

The current lab only depends on a small subset of App Studio host behavior:

| Capability | Required | Why |
| --- | --- | --- |
| `toolInput` | Yes | Base fixture ID and manual JSON editing live here. |
| `callTool()` | Yes | Toolbar actions route through preview-control tools. |
| `widgetState` | Optional but preferred | Tool-driven fixture switches and overrides are layered here so `toolInput` stays stable. |
| Theme / display mode | Optional | Cosmetic parity with the host shell only. |
| Real MCP server | No | The current slice is mock-first and stays in no-server mode. |
| Running Grime Time app | Required for `Live` tab only | The live catalog proxies the main app's local Payload-backed route. |

## Live page contract

The `Live` tab expects one private Payload page in Grime Time that acts as the
source of truth for reviewable blocks.

- Default page slug: `block-lab`
- Required visibility: `private`
- Suggested usage: add one instance of each block you want to inspect in the
  lab, then refresh the live tab to pull that page's `layout`

If you want a different slug in your local environment, set
`GRIME_TIME_BLOCK_LAB_PAGE_SLUG` in the main Grime Time app env.

## Planning links

- Workflow: `.planning/workflows/block-lab-mcp-playground.md`
- Phase plan: `.planning/phases/20-block-lab-mcp-playground/PLAN.xml`
- Tasks: `.planning/TASK-REGISTRY.xml` (`20-01`, `20-02`, `20-03`, `20-04`)

## Next steps

- Add more block entries to the registry as preview surfaces stabilize.
- Decide whether `20-04` is still worth shipping as a staff-only browser route,
  or keep the App Studio shell as the only review surface for now.
- Optionally mirror the same fixture registry into a staff-only Next route for
  browser-only iteration if the block list grows beyond what the lab shell
  comfortably handles (`20-04`).
