import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getLegacyVisibilityKeys, normalizeToolVisibility } from "./visibility";

describe("normalizeToolVisibility", () => {
  it("normalizes explicit ui.visibility in MCP order", () => {
    const result = normalizeToolVisibility({
      ui: { visibility: ["app", "model", "app"] },
    });

    assert.deepEqual(result.canonical, ["model", "app"]);
    assert.equal(result.source, "ui");
    assert.deepEqual(result.invalidEntries, []);
  });

  it("tracks invalid visibility entries", () => {
    const result = normalizeToolVisibility({
      ui: { visibility: ["model", "host", 1] },
    });

    assert.deepEqual(result.canonical, ["model"]);
    assert.equal(result.source, "ui");
    assert.deepEqual(result.invalidEntries, ["host", 1]);
  });

  it("ignores legacy visibility keys when ui.visibility is absent", () => {
    const result = normalizeToolVisibility({
      "openai/visibility": "private",
      "openai/widgetAccessible": true,
    });
    assert.equal(result.canonical, undefined);
    assert.equal(result.source, "default");
    assert.deepEqual(result.invalidEntries, []);
  });
});

describe("getLegacyVisibilityKeys", () => {
  it("detects OpenAI legacy visibility keys", () => {
    const keys = getLegacyVisibilityKeys({
      ui: { visibility: ["model"] },
      "openai/visibility": "public",
      "openai/widgetAccessible": true,
    });
    assert.deepEqual(keys, ["openai/visibility", "openai/widgetAccessible"]);
  });
});
