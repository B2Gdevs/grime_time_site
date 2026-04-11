import {
  isToolVisibilityAppOnly,
  isToolVisibilityModelOnly,
} from "@modelcontextprotocol/ext-apps/app-bridge";
import { getLegacyVisibilityKeys, normalizeToolVisibility } from "./visibility";

export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  field: string;
  message: string;
  suggestion?: string;
}

function toToolVisibilityInput(
  meta: Record<string, unknown>,
): Parameters<typeof isToolVisibilityModelOnly>[0] {
  return { _meta: meta };
}

export function validateToolDescriptorMeta(
  metaInput: Record<string, unknown>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const meta = metaInput ?? {};

  const ui = meta.ui as { resourceUri?: unknown } | undefined;
  const resourceUri =
    ui && typeof ui === "object"
      ? (ui as { resourceUri?: unknown }).resourceUri
      : undefined;

  const hasUiResourceUri = typeof resourceUri === "string";

  if (!hasUiResourceUri) {
    issues.push({
      severity: "error",
      field: "_meta.ui.resourceUri",
      message:
        "Missing output template URI. Your component won't render without this.",
      suggestion:
        "Add _meta.ui.resourceUri pointing to your component HTML resource URI (e.g. ui://widget/main.html).",
    });
  }

  if (Object.hasOwn(meta, "openai/outputTemplate")) {
    issues.push({
      severity: "warning",
      field: '_meta["openai/outputTemplate"]',
      message:
        "Legacy metadata key detected. openai/outputTemplate is not part of the latest MCP Apps metadata shape.",
      suggestion:
        "Use _meta.ui.resourceUri instead and remove openai/outputTemplate.",
    });
  }

  const legacyVisibilityKeys = getLegacyVisibilityKeys(meta);
  if (legacyVisibilityKeys.length > 0) {
    issues.push({
      severity: "warning",
      field: "_meta.ui.visibility",
      message:
        "Legacy OpenAI visibility keys detected. Latest MCP Apps visibility should be defined only via _meta.ui.visibility.",
      suggestion: `Remove ${legacyVisibilityKeys.join(", ")} and set _meta.ui.visibility explicitly.`,
    });
  }

  const normalizedVisibility = normalizeToolVisibility(meta);
  if (normalizedVisibility.invalidEntries.length > 0) {
    issues.push({
      severity: "warning",
      field: "_meta.ui.visibility",
      message:
        'ui.visibility contains invalid entries. Only "model" and "app" are allowed.',
      suggestion:
        'Set _meta.ui.visibility to an array containing only "model" and/or "app".',
    });
  }

  if (
    normalizedVisibility.source === "ui" &&
    (normalizedVisibility.canonical ?? []).length === 0
  ) {
    issues.push({
      severity: "warning",
      field: "_meta.ui.visibility",
      message:
        "Tool visibility is explicitly empty. This hides the tool from both model and app.",
      suggestion:
        'Set _meta.ui.visibility to include "model" or "app" based on who should invoke the tool.',
    });
  }

  const toolProxy = toToolVisibilityInput(meta);
  if (isToolVisibilityModelOnly(toolProxy)) {
    issues.push({
      severity: "info",
      field: "_meta.ui.visibility",
      message: "Tool is model-only. The widget cannot call this tool directly.",
      suggestion:
        'Add "app" to _meta.ui.visibility if the widget needs to invoke this tool.',
    });
  }

  if (isToolVisibilityAppOnly(toolProxy)) {
    issues.push({
      severity: "info",
      field: "_meta.ui.visibility",
      message: "Tool is app-only. The model will not see or invoke this tool.",
      suggestion:
        'Add "model" to _meta.ui.visibility if the model should be able to call this tool.',
    });
  }

  const invokingText = meta["openai/toolInvocation/invoking"];
  if (typeof invokingText === "string" && invokingText.length > 64) {
    issues.push({
      severity: "warning",
      field: '_meta["openai/toolInvocation/invoking"]',
      message: `Status text is ${invokingText.length} characters. Maximum is 64.`,
      suggestion: "Shorten the invoking status text to 64 characters or less.",
    });
  }

  return issues;
}
