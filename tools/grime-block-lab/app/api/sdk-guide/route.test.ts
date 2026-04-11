import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createValidateConfigTool } from "./route";

describe("sdk-guide validate_config tool integration", () => {
  it("reports strict latest warning for legacy visibility keys", async () => {
    const tool = createValidateConfigTool({
      selectedComponent: "test",
      displayMode: "inline",
      toolInput: {
        _meta: {
          ui: { resourceUri: "ui://widget/main.html" },
          "openai/visibility": "private",
          "openai/widgetAccessible": true,
        },
      },
      toolOutput: null,
      widgetState: null,
      recentConsoleLogs: [],
    });

    const result = await tool.execute({ configType: "tool_descriptor" });
    assert.equal(result.valid, true);
    assert.equal(
      result.issues.some(
        (issue) =>
          issue.severity === "warning" &&
          issue.field === "_meta.ui.visibility" &&
          issue.message.includes("Legacy OpenAI visibility keys"),
      ),
      true,
    );
  });

  it("reports empty visibility warning through the route tool wrapper", async () => {
    const tool = createValidateConfigTool({
      selectedComponent: "test",
      displayMode: "inline",
      toolInput: {
        _meta: {
          ui: {
            resourceUri: "ui://widget/main.html",
            visibility: [],
          },
        },
      },
      toolOutput: null,
      widgetState: null,
      recentConsoleLogs: [],
    });

    const result = await tool.execute({ configType: "tool_descriptor" });
    assert.equal(
      result.issues.some(
        (issue) =>
          issue.severity === "warning" &&
          issue.field === "_meta.ui.visibility" &&
          issue.message.includes("explicitly empty"),
      ),
      true,
    );
  });
});
