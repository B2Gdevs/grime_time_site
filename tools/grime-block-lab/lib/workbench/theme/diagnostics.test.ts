import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analyzeThemeDiagnostics,
  scanThemeDiagnosticsForComponent,
} from "./diagnostics";

describe("theme diagnostics", () => {
  it("flags common hardcoded color risks", () => {
    const source = `
      const a = <div className="bg-white text-black border-white" />;
      const b = <div style={{ color: "black", backgroundColor: "#fff" }} />;
    `;
    const diagnostics = analyzeThemeDiagnostics(source);
    assert.ok(diagnostics.length >= 3);
    assert.ok(
      diagnostics.some((d) => d.ruleId === "hardcoded-utility-color"),
      "expected hardcoded utility color warning",
    );
    assert.ok(
      diagnostics.some((d) => d.ruleId === "hardcoded-hex"),
      "expected hardcoded hex warning",
    );
  });

  it("stays non-blocking for semantic token usage", () => {
    const source = `
      const good = <div className="bg-background text-foreground border-border" />;
      const ok = <div style={{ color: "var(--foreground)" }} />;
    `;
    const diagnostics = analyzeThemeDiagnostics(source);
    assert.equal(diagnostics.length, 0);
  });

  it("does not include files from other components", async () => {
    const results = await scanThemeDiagnosticsForComponent(
      "poi-map",
      process.cwd(),
    );
    const filePaths = results.map((r) => r.filePath);
    const hasWelcome = filePaths.some((f) => f.includes("welcome"));
    assert.equal(
      hasWelcome,
      false,
      `poi-map scan should not include welcome files, got: ${filePaths.filter((f) => f.includes("welcome")).join(", ")}`,
    );
  });
});
