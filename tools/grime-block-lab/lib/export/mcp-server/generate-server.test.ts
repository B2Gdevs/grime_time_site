import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateServerEntry } from "./generate-server";
import type { MCPServerConfig } from "./types";

function createConfig(
  overrides?: Partial<MCPServerConfig>,
): MCPServerConfig & { tools: NonNullable<MCPServerConfig["tools"]> } {
  return {
    name: "test-server",
    version: "1.0.0",
    tools: [
      {
        name: "example_tool",
        description: "example",
      },
    ],
    ...overrides,
  };
}

function parseToolMeta(entry: string): Record<string, unknown> {
  const match = entry.match(
    /server\.registerTool\([\s\S]*?_meta:\s*(\{[\s\S]*?\})\s*,\n\s*\},\n\s*[a-zA-Z0-9_]+Handler/,
  );
  assert.ok(match?.[1], "tool _meta JSON not found");
  return JSON.parse(match[1]);
}

function parseJsonObjectAfter(
  source: string,
  marker: string,
): Record<string, unknown> {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `marker not found: ${marker}`);

  const start = source.indexOf("{", markerIndex);
  assert.notEqual(start, -1, `object start not found after marker: ${marker}`);

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index++) {
    const char = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(source.slice(start, index + 1));
      }
    }
  }

  throw new Error(`unterminated JSON object after marker: ${marker}`);
}

describe("generateServerEntry resource metadata", () => {
  it("does not emit invalid scriptSrc CSP keys", () => {
    const entry = generateServerEntry(createConfig());
    assert.equal(entry.includes("scriptSrc"), false);
  });

  it("uses the ext-apps MCP resource MIME type constant", () => {
    const entry = generateServerEntry(createConfig());
    assert.equal(
      entry.includes(
        'import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";',
      ),
      true,
    );
    assert.equal(entry.includes("mimeType: RESOURCE_MIME_TYPE"), true);
  });

  it("emits listing-level and content-level ui metadata with configurable CSP", () => {
    const entry = generateServerEntry(
      createConfig({
        widgetResourceMeta: {
          ui: {
            csp: {
              connectDomains: ["https://api.example.com"],
              resourceDomains: ["https://cdn.example.com"],
            },
          },
        },
      }),
    );

    assert.equal(entry.includes('"connectDomains"'), true);
    assert.equal(entry.includes('"https://api.example.com"'), true);
    assert.equal(entry.includes('"resourceDomains"'), true);
    assert.equal(entry.includes('"prefersBorder": true'), true);

    const listing = parseJsonObjectAfter(entry, `"ui://widget/main.html",`);
    const contentMeta = parseJsonObjectAfter(entry, "_meta:");
    assert.deepEqual(listing._meta, contentMeta);
    assert.equal(entry.includes("openai/widgetPrefersBorder"), false);
  });
});

describe("generateServerEntry tool visibility", () => {
  it("emits explicit ui.visibility when provided", () => {
    const entry = generateServerEntry(
      createConfig({
        tools: [
          {
            name: "example_tool",
            meta: {
              ui: { visibility: ["app"] },
            },
          },
        ],
      }),
    );

    const meta = parseToolMeta(entry);
    assert.deepEqual(meta.ui, {
      resourceUri: "ui://widget/main.html",
      visibility: ["app"],
    });
  });

  it("does not derive visibility from legacy OpenAI keys", () => {
    const entry = generateServerEntry(
      createConfig({
        tools: [
          {
            name: "example_tool",
            meta: {
              "openai/visibility": "public",
              "openai/widgetAccessible": false,
            } as unknown as MCPServerConfig["tools"][number]["meta"],
          },
        ],
      }),
    );

    const meta = parseToolMeta(entry);
    assert.deepEqual(meta.ui, { resourceUri: "ui://widget/main.html" });
    assert.equal("openai/visibility" in meta, false);
    assert.equal("openai/widgetAccessible" in meta, false);
  });

  it("keeps OpenAI invocation status metadata when present", () => {
    const entry = generateServerEntry(
      createConfig({
        tools: [
          {
            name: "example_tool",
            meta: {
              "openai/toolInvocation/invoking": "Working...",
              "openai/toolInvocation/invoked": "Done",
            },
          },
        ],
      }),
    );

    const meta = parseToolMeta(entry);
    assert.equal(meta["openai/toolInvocation/invoking"], "Working...");
    assert.equal(meta["openai/toolInvocation/invoked"], "Done");
  });
});
