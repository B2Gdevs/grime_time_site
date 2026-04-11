export type ToolVisibility = "model" | "app";

export interface NormalizedToolVisibility {
  canonical: ToolVisibility[] | undefined;
  source: "ui" | "default";
  invalidEntries: unknown[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toOrderedUniqueVisibility(values: ToolVisibility[]): ToolVisibility[] {
  const set = new Set(values);
  const ordered: ToolVisibility[] = [];
  if (set.has("model")) ordered.push("model");
  if (set.has("app")) ordered.push("app");
  return ordered;
}

export function getLegacyVisibilityKeys(
  meta: Record<string, unknown> | undefined,
): string[] {
  if (!meta) return [];
  const keys: string[] = [];
  for (const key of ["openai/visibility", "openai/widgetAccessible"] as const) {
    if (Object.hasOwn(meta, key)) keys.push(key);
  }
  return keys;
}

/**
 * Canonicalizes MCP-standard ui.visibility and reports invalid entries.
 * Legacy OpenAI visibility keys are intentionally ignored here.
 */
export function normalizeToolVisibility(
  meta: Record<string, unknown> | undefined,
): NormalizedToolVisibility {
  const safeMeta = meta ?? {};
  const invalidEntries: unknown[] = [];

  const ui = isRecord(safeMeta.ui) ? safeMeta.ui : undefined;
  const rawVisibility = ui?.visibility;

  if (rawVisibility !== undefined) {
    if (!Array.isArray(rawVisibility)) {
      invalidEntries.push(rawVisibility);
      return {
        canonical: undefined,
        source: "default",
        invalidEntries,
      };
    }

    const parsed: ToolVisibility[] = [];
    for (const candidate of rawVisibility) {
      if (candidate === "model" || candidate === "app") {
        parsed.push(candidate);
      } else {
        invalidEntries.push(candidate);
      }
    }

    return {
      canonical: toOrderedUniqueVisibility(parsed),
      source: "ui",
      invalidEntries,
    };
  }

  return {
    canonical: undefined,
    source: "default",
    invalidEntries,
  };
}
