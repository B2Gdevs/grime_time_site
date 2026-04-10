# Grime Time block lab (MCP App Studio)

Isolated workspace to preview Payload **layout blocks** with **mock data** and to experiment with **MCP tools** / host behavior before blocks ship in the CMS or on public pages.

## Why this exists

- Production blocks live under `src/blocks/` and are wired through `RenderBlocks.tsx`, the page composer, and Payload. WIP blocks should not require a published page.
- [MCP App Studio](https://www.assistant-ui.com/mcp-app-studio) provides hot reload, mock tool responses, and an export path for widgets that run inside MCP-capable hosts.

## Scaffold (interactive)

From this directory’s parent (`vendor/grime-time-site/tools/`):

```bash
cd vendor/grime-time-site/tools
npx mcp-app-studio grime-block-lab
```

The CLI will ask for an app description and other options — complete the prompts, then **commit** the generated project into this repo.

If the folder already contains generated files, follow the upstream README inside that project for `npm run dev` and export.

## Planning

- Workflow + requirements: `.planning/workflows/block-lab-mcp-playground.md`
- Phase plan: `.planning/phases/20-block-lab-mcp-playground/PLAN.xml`
- GAD tasks: `20-01` … `20-04` in `.planning/TASK-REGISTRY.xml`

## Sharing code with the main app

Direct imports from `../../src/blocks/*` often pull `@/` aliases and server-only modules. Prefer **fixtures + thin preview components** first, then extract shared presentation into neutral modules as blocks stabilize (see workflow doc).

## Optional: staff-only Next route

Phase `20-04` may add a membership-gated in-app page that reuses the same fixture registry for pure browser iteration without MCP.
