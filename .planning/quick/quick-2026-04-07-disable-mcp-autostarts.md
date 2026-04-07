# Quick: quick-2026-04-07-disable-mcp-autostarts

**Status:** done
**Date:** 2026-04-07

## Task

Disable repo-local Payload/Image MCP auto-starts for Grime Time by forcing dev-time MCP off, disabling those Cursor MCP servers, and keeping the manual launcher scripts intact while leaving Playwright MCP available for browser testing; also harden the live visual composer bar coverage so the page title, slug, page picker, draft, publish, and preview controls stay on the top bar.

## Verify

- `npm.cmd exec eslint scripts/dev-with-services.mjs scripts/lib/dev-runtime-env.mjs tests/int/scripts/dev-runtime-env.int.spec.ts tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx`
- `npm.cmd exec vitest run tests/int/scripts/dev-runtime-env.int.spec.ts tests/int/components/admin-impersonation/page-composer-canvas.int.spec.tsx`
- manual check: `.cursor/mcp.json` keeps `playwright` enabled and both `payload_local` / `image_gen_local` disabled
