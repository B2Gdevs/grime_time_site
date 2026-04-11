import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateToolDescriptorMeta } from "./validate-tool-meta";

describe("validateToolDescriptorMeta", () => {
  it("warns when legacy visibility keys are present", () => {
    const issues = validateToolDescriptorMeta({
      ui: { resourceUri: "ui://widget/main.html" },
      "openai/visibility": "private",
      "openai/widgetAccessible": true,
    });

    assert.equal(
      issues.some(
        (issue) =>
          issue.severity === "warning" &&
          issue.field === "_meta.ui.visibility" &&
          issue.message.includes("Legacy OpenAI visibility keys"),
      ),
      true,
    );
  });

  it("warns when ui.visibility contains invalid entries", () => {
    const issues = validateToolDescriptorMeta({
      ui: {
        resourceUri: "ui://widget/main.html",
        visibility: ["model", "host"] as unknown as Array<"model" | "app">,
      },
    });

    assert.equal(
      issues.some(
        (issue) =>
          issue.severity === "warning" &&
          issue.field === "_meta.ui.visibility" &&
          issue.message.includes("invalid entries"),
      ),
      true,
    );
  });

  it("warns when ui.visibility is explicitly empty", () => {
    const issues = validateToolDescriptorMeta({
      ui: { resourceUri: "ui://widget/main.html", visibility: [] },
    });

    assert.equal(
      issues.some(
        (issue) =>
          issue.severity === "warning" &&
          issue.field === "_meta.ui.visibility" &&
          issue.message.includes("explicitly empty"),
      ),
      true,
    );
  });

  it("warns when openai/outputTemplate is present", () => {
    const issues = validateToolDescriptorMeta({
      ui: { resourceUri: "ui://widget/main.html" },
      "openai/outputTemplate": "ui://widget/main.html",
    });

    assert.equal(
      issues.some(
        (issue) =>
          issue.severity === "warning" &&
          issue.field === '_meta["openai/outputTemplate"]',
      ),
      true,
    );
  });
});
