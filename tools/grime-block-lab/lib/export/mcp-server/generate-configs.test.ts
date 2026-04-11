import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generatePackageJson } from "./generate-configs";
import type { MCPServerConfig } from "./types";

const TEST_CONFIG: MCPServerConfig = {
  name: "Test Server",
  version: "1.0.0",
  tools: [],
};

describe("generatePackageJson", () => {
  it("includes ext-apps when generated server imports ext-apps helpers", () => {
    const pkg = JSON.parse(generatePackageJson(TEST_CONFIG)) as {
      dependencies?: Record<string, string>;
    };

    assert.equal(
      pkg.dependencies?.["@modelcontextprotocol/ext-apps"],
      "^1.1.2",
    );
  });
});
