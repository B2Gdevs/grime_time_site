import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it } from "node:test";

const TARGET_FILE = path.resolve(
  process.cwd(),
  "components/workbench/iframe-component-content.tsx",
);

describe("IframeComponentContent regression coverage", () => {
  it("wraps iframe preview content in ComponentErrorBoundary", () => {
    const source = fs.readFileSync(TARGET_FILE, "utf8");

    assert.ok(source.includes("ComponentErrorBoundary"));
    assert.ok(source.includes("useToolInput"));
    assert.match(
      source,
      /<ComponentErrorBoundary\s+toolInput=\{toolInput\}>[\s\S]*<IframeComponentRenderer\s*\/>[\s\S]*<\/ComponentErrorBoundary>/,
    );
  });

  it("isolates theme only for the mounted widget, not loading/error placeholders", () => {
    const source = fs.readFileSync(TARGET_FILE, "utf8");

    assert.match(source, /if \(showLoading\) \{/);
    assert.match(source, /if \(!hmrActive && error\) \{/);
    assert.match(
      source,
      /<IsolatedThemeWrapper className="flex h-full w-full">[\s\S]*<WidgetIframeHost/,
    );
  });

  it("computes HMR src and passes it to WidgetIframeHost", () => {
    const source = fs.readFileSync(TARGET_FILE, "utf8");
    assert.match(
      source,
      /buildHmrPreviewPath\(selectedComponent, currentLocationSearch\)/,
    );
    assert.match(source, /hmrSrc=\{hmrSrc\}/);
  });

  it("treats HMR as auto-on in development and falls back without hard-failing when runtime is unavailable", () => {
    const source = fs.readFileSync(TARGET_FILE, "utf8");
    assert.match(
      source,
      /const hmrEligible =\s*process\.env\.NODE_ENV === "development" && !isDemoMode;/,
    );
    assert.doesNotMatch(source, /useHmrPreview/);
    assert.doesNotMatch(source, /if \(hmrEligible && hmrError\)/);
    assert.match(source, /setHmrRuntimeStatus\(\s*"error"/);
  });
});
