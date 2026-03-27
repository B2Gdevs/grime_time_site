# Payload MCP and Editor Setup

Planning anchors
- Phase: `04`
- Tasks: `04-01`, `04-03`

Purpose
- Use Payload's official MCP server instead of ad hoc CMS-editing bridges.
- Keep MCP attached to the same local app server so `npm run dev` can expose the endpoint once the feature is enabled.
- Document how Cursor and Codex should connect without committing secrets.

Repo files
- [`src/payload.config.ts`](../../src/payload.config.ts)
- [`.env.example`](../../.env.example)
- [`.cursor/mcp.json`](../../.cursor/mcp.json)
- [`.codex/payload-mcp.example.toml`](../../.codex/payload-mcp.example.toml)
- [`.codex/image-gen-mcp.example.toml`](../../.codex/image-gen-mcp.example.toml)
- [`scripts/verify-mcp.mjs`](../../scripts/verify-mcp.mjs)
- [`.planning/workflows/image-generation-mcp-and-media-workflow.md`](./image-generation-mcp-and-media-workflow.md)

Current policy
- The MCP package is installed and wired behind `PAYLOAD_MCP_ENABLED=true`.
- Do not enable it on a database that has not approved and run the matching migration, because the official plugin adds MCP API key data.
- When the env flag is off, the normal site and admin should stay unaffected.
- In the current repo state, `/api/mcp` returning `404` means the env gate is still off. It is not an application routing bug.
- Use `http://localhost:5465/api/mcp` for local editor config so it matches the normal Next dev origin.
- The repo now contains an unapplied migration for MCP enablement at [`src/migrations/20260324_024258_add_payload_mcp_api_keys.ts`](../../src/migrations/20260324_024258_add_payload_mcp_api_keys.ts). It also captures unapplied quote-schema deltas, so the approval step should treat them as one migration window.

Enablement flow
1. Approve and run the relevant Payload migration for MCP API keys.
2. Set `PAYLOAD_MCP_ENABLED=true` in `.env`.
3. Restart `npm run dev`.
4. Open Payload admin and create an MCP API key.
5. Paste that API key into your local Cursor or Codex MCP config.
6. Test with an MCP client using `POST /api/mcp`. A browser `GET /api/mcp` is not a meaningful MCP test.

Verification flow
1. Start the app server with `npm run dev`.
2. Ensure `PAYLOAD_MCP_ENABLED=true` and `PAYLOAD_MCP_API_KEY` is present in `.env`.
3. Run `npm run verify:mcp`.
4. Expect `payload endpoint` to report a non-401/non-404 HTTP response and `image-gen stdio` to report a successful launcher start.
5. If the script fails, treat the failing check as the exact repair target instead of re-debugging editor config by hand.

Local endpoint
- `http://localhost:5465/api/mcp`

Cursor
- The repo ships a project-level config in [`.cursor/mcp.json`](../../.cursor/mcp.json) with server names aligned to Codex: `payload_local`, `image_gen_local`.
- **Payload:** set `PAYLOAD_MCP_API_KEY` in the repo root `.env` (create the key in Payload Admin after MCP is enabled). [scripts/payload-mcp-stdio.mjs](../../scripts/payload-mcp-stdio.mjs) runs `mcp-remote` with that secret so nothing sensitive is committed.
- **Image gen:** same as Codex — `node scripts/image-gen-mcp-start.mjs --transport stdio` with `cwd` at the workspace root; ensure `OPENAI_API_KEY` / image MCP env in `.env` per [image-generation-mcp-and-media-workflow.md](./image-generation-mcp-and-media-workflow.md).
- Toggle each server with `"enabled": true | false` in `.cursor/mcp.json` if you need Cursor to start without those MCPs.

Codex
- Codex uses the user config at `~/.codex/config.toml`.
- Copy the snippet from [`.codex/payload-mcp.example.toml`](../../.codex/payload-mcp.example.toml) into the global config and replace `REPLACE_WITH_PAYLOAD_MCP_API_KEY`.
- If you also want the repo-local image MCP, copy the snippet from [`.codex/image-gen-mcp.example.toml`](../../.codex/image-gen-mcp.example.toml).

References
- Payload official MCP plugin docs: https://payloadcms.com/docs/plugins/mcp
- Cursor connection format is documented on that same Payload MCP page.
