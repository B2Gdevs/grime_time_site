"use client";

import {
  blockFixtureRegistry,
  getBlockFixture,
  type ServiceGridFixtureId,
} from "@/lib/fixtures/block-fixture-registry";
import type { ServiceGridBlockFixture } from "@/lib/fixtures/service-grid";
import type { ToolResult } from "@/lib/sdk";
import type { ServiceGridWorkbenchInput } from "./demo/default-props";
import {
  createToolMockConfig,
  type MockConfigState,
  type ToolAnnotations,
  type ToolDescriptorMeta,
  type ToolMockConfig,
  type ToolSchemas,
} from "./mock-config";
import type { CallToolResponse } from "./types";

export const PREVIEW_TOOL_NAMES = [
  "list_blocks",
  "set_preview_block",
  "apply_preview_overrides",
] as const;

export type PreviewToolName = (typeof PREVIEW_TOOL_NAMES)[number];

const SERVICE_GRID_TOOL_BLOCK_TYPE = "serviceGrid";
const SERVICE_GRID_TOOL_BLOCK_ALIAS = "service-grid";

type PreviewToolDefinition = {
  annotations?: ToolAnnotations;
  descriptorMeta?: ToolDescriptorMeta;
  schemas?: ToolSchemas;
};

export interface ServiceGridFixtureSummary {
  fixtureId: ServiceGridFixtureId;
  label: string;
  displayVariant: ServiceGridBlockFixture["displayVariant"];
  heading: string;
  serviceCount: number;
  hasMedia: boolean;
}

export interface ServiceGridPreviewCatalog {
  blockType: "serviceGrid";
  label: string;
  description: string;
  defaultFixtureId: ServiceGridFixtureId;
  fixtures: ServiceGridFixtureSummary[];
}

export interface PreviewBlocksStructuredContent
  extends Record<string, unknown> {
  blocks: ServiceGridPreviewCatalog[];
  hostCapabilities: {
    required: string[];
    optional: string[];
  };
}

export interface PreviewStateStructuredContent extends Record<string, unknown> {
  previewState: ServiceGridPreviewWidgetState | null;
  activeBlockType: "serviceGrid";
  fixtureId: ServiceGridFixtureId;
  fixtureLabel: string;
  appliedKeys?: string[];
}

export interface ServiceGridPreviewWidgetState extends Record<string, unknown> {
  blockType: "serviceGrid";
  fixtureId?: ServiceGridFixtureId;
  block?: ServiceGridWorkbenchInput["block"];
}

const previewToolDefinitions: Record<PreviewToolName, PreviewToolDefinition> = {
  list_blocks: {
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
    descriptorMeta: {
      ui: {
        visibility: ["model", "app"],
      },
      "openai/toolInvocation/invoking": "Listing preview blocks",
      "openai/toolInvocation/invoked": "Preview blocks ready",
    },
    schemas: {
      inputSchema: {
        type: "object",
        additionalProperties: false,
      },
      outputSchema: {
        type: "object",
        properties: {
          blocks: { type: "array" },
          hostCapabilities: { type: "object" },
        },
        required: ["blocks", "hostCapabilities"],
      },
    },
  },
  set_preview_block: {
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
    descriptorMeta: {
      ui: {
        visibility: ["model", "app"],
      },
      "openai/toolInvocation/invoking": "Switching preview fixture",
      "openai/toolInvocation/invoked": "Preview fixture updated",
    },
    schemas: {
      inputSchema: {
        type: "object",
        properties: {
          blockType: {
            type: "string",
            enum: [SERVICE_GRID_TOOL_BLOCK_TYPE, SERVICE_GRID_TOOL_BLOCK_ALIAS],
          },
          fixtureId: {
            type: "string",
            enum: Object.keys(blockFixtureRegistry.serviceGrid.fixtures),
          },
          preserveOverrides: { type: "boolean" },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: "object",
        properties: {
          previewState: { type: "object" },
          activeBlockType: { type: "string" },
          fixtureId: { type: "string" },
          fixtureLabel: { type: "string" },
        },
        required: [
          "previewState",
          "activeBlockType",
          "fixtureId",
          "fixtureLabel",
        ],
      },
    },
  },
  apply_preview_overrides: {
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
    descriptorMeta: {
      ui: {
        visibility: ["model", "app"],
      },
      "openai/toolInvocation/invoking": "Applying preview overrides",
      "openai/toolInvocation/invoked": "Preview overrides applied",
    },
    schemas: {
      inputSchema: {
        type: "object",
        properties: {
          blockType: {
            type: "string",
            enum: [SERVICE_GRID_TOOL_BLOCK_TYPE, SERVICE_GRID_TOOL_BLOCK_ALIAS],
          },
          fixtureId: {
            type: "string",
            enum: Object.keys(blockFixtureRegistry.serviceGrid.fixtures),
          },
          block: {
            type: "object",
            additionalProperties: true,
          },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: "object",
        properties: {
          previewState: { type: "object" },
          activeBlockType: { type: "string" },
          fixtureId: { type: "string" },
          fixtureLabel: { type: "string" },
          appliedKeys: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "previewState",
          "activeBlockType",
          "fixtureId",
          "fixtureLabel",
          "appliedKeys",
        ],
      },
    },
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toTitleCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeBlockType(value: unknown): "serviceGrid" | null {
  if (value === undefined || value === null) {
    return SERVICE_GRID_TOOL_BLOCK_TYPE;
  }

  if (
    value === SERVICE_GRID_TOOL_BLOCK_TYPE ||
    value === SERVICE_GRID_TOOL_BLOCK_ALIAS
  ) {
    return SERVICE_GRID_TOOL_BLOCK_TYPE;
  }

  return null;
}

export function isPreviewToolName(
  toolName: string,
): toolName is PreviewToolName {
  return PREVIEW_TOOL_NAMES.includes(toolName as PreviewToolName);
}

export function getServiceGridFixtureSummaries(): ServiceGridFixtureSummary[] {
  return Object.entries(blockFixtureRegistry.serviceGrid.fixtures).map(
    ([fixtureId, fixture]) => ({
      fixtureId: fixtureId as ServiceGridFixtureId,
      label: toTitleCase(fixture.displayVariant),
      displayVariant: fixture.displayVariant,
      heading: fixture.heading,
      serviceCount: fixture.services.length,
      hasMedia: fixture.services.some((service) => {
        const media = (service as { media?: { src?: string } }).media;
        return Boolean(media?.src);
      }),
    }),
  );
}

export function getPreviewBlocksStructuredContent(): PreviewBlocksStructuredContent {
  return {
    blocks: [
      {
        blockType: "serviceGrid",
        label: "Service Grid",
        description:
          "Fixture-driven block preview for service lanes, cards, and pricing explainers.",
        defaultFixtureId: blockFixtureRegistry.serviceGrid.defaultFixtureId,
        fixtures: getServiceGridFixtureSummaries(),
      },
    ],
    hostCapabilities: {
      required: ["toolInput", "callTool"],
      optional: ["widgetState", "theme", "displayMode"],
    },
  };
}

function mergeToolConfigDefinition(
  toolConfig: ToolMockConfig,
  definition: PreviewToolDefinition,
): ToolMockConfig {
  return {
    ...toolConfig,
    annotations: toolConfig.annotations ?? definition.annotations,
    descriptorMeta: toolConfig.descriptorMeta ?? definition.descriptorMeta,
    schemas: {
      ...(definition.schemas ?? {}),
      ...(toolConfig.schemas ?? {}),
    },
  };
}

export function withPreviewToolDefinitions(
  mockConfig: MockConfigState,
): MockConfigState {
  const tools = { ...mockConfig.tools };

  for (const toolName of PREVIEW_TOOL_NAMES) {
    const toolConfig = tools[toolName] ?? createToolMockConfig(toolName);
    tools[toolName] = mergeToolConfigDefinition(
      toolConfig,
      previewToolDefinitions[toolName],
    );
  }

  return {
    ...mockConfig,
    tools,
  };
}

function resolveFixtureId(
  fixtureId: unknown,
): { fixtureId: ServiceGridFixtureId } | { error: CallToolResponse } {
  if (fixtureId === undefined || fixtureId === null) {
    return { fixtureId: blockFixtureRegistry.serviceGrid.defaultFixtureId };
  }

  if (
    typeof fixtureId === "string" &&
    fixtureId in blockFixtureRegistry.serviceGrid.fixtures
  ) {
    return { fixtureId: fixtureId as ServiceGridFixtureId };
  }

  return {
    error: {
      isError: true,
      content: `Unknown service-grid fixture "${String(fixtureId)}".`,
      structuredContent: {
        availableFixtureIds: Object.keys(
          blockFixtureRegistry.serviceGrid.fixtures,
        ),
      },
    },
  };
}

function normalizeBlockOverrides(
  block: unknown,
): ServiceGridWorkbenchInput["block"] | undefined {
  if (!isRecord(block)) {
    return undefined;
  }

  return block as ServiceGridWorkbenchInput["block"];
}

export function getFixtureSummary(
  fixtureId: ServiceGridFixtureId,
): ServiceGridFixtureSummary {
  const fixtures = getServiceGridFixtureSummaries();
  return (
    fixtures.find((fixture) => fixture.fixtureId === fixtureId) ?? fixtures[0]
  );
}

export function buildSetPreviewBlockResponse(
  args: Record<string, unknown>,
): CallToolResponse {
  const blockType = normalizeBlockType(args.blockType);
  if (!blockType) {
    return {
      isError: true,
      content: `Unsupported block type "${String(args.blockType)}".`,
      structuredContent: {
        availableBlockTypes: [SERVICE_GRID_TOOL_BLOCK_TYPE],
      },
    };
  }

  const fixtureResult = resolveFixtureId(args.fixtureId);
  if ("error" in fixtureResult) {
    return fixtureResult.error;
  }

  const preserveOverrides = args.preserveOverrides === true;
  const fixtureSummary = getFixtureSummary(fixtureResult.fixtureId);

  return {
    structuredContent: {
      previewState: {
        blockType,
        fixtureId: fixtureResult.fixtureId,
        ...(preserveOverrides ? {} : { block: undefined }),
      },
      activeBlockType: blockType,
      fixtureId: fixtureResult.fixtureId,
      fixtureLabel: fixtureSummary.label,
    } satisfies PreviewStateStructuredContent,
    content: `Loaded the ${fixtureSummary.label} fixture.`,
  };
}

export function createSamplePreviewOverride(
  fixtureId: ServiceGridFixtureId,
): ServiceGridWorkbenchInput["block"] {
  const fixture = getBlockFixture("serviceGrid", fixtureId);
  const firstService = fixture.services[0];

  return {
    heading: `${fixture.heading} / tool override`,
    intro:
      "Tool-applied copy for a fast review pass. Keep the base fixture in toolInput and layer experiments through widgetState.",
    services: firstService
      ? [
          {
            ...firstService,
            summary:
              "This sample override is driven by the App Studio tool layer so you can compare custom JSON against the base fixture without leaving the preview.",
            pricingHint: "Tool-applied sample",
          },
          ...fixture.services.slice(1),
        ]
      : fixture.services,
  };
}

export function buildApplyPreviewOverridesResponse(
  args: Record<string, unknown>,
): CallToolResponse {
  const blockType = normalizeBlockType(args.blockType);
  if (!blockType) {
    return {
      isError: true,
      content: `Unsupported block type "${String(args.blockType)}".`,
      structuredContent: {
        availableBlockTypes: [SERVICE_GRID_TOOL_BLOCK_TYPE],
      },
    };
  }

  const fixtureResult = resolveFixtureId(args.fixtureId);
  if ("error" in fixtureResult) {
    return fixtureResult.error;
  }

  const normalizedBlock =
    normalizeBlockOverrides(args.block) ??
    createSamplePreviewOverride(fixtureResult.fixtureId);
  const fixtureSummary = getFixtureSummary(fixtureResult.fixtureId);

  return {
    structuredContent: {
      previewState: {
        blockType,
        fixtureId: fixtureResult.fixtureId,
        block: normalizedBlock,
      },
      activeBlockType: blockType,
      fixtureId: fixtureResult.fixtureId,
      fixtureLabel: fixtureSummary.label,
      appliedKeys: Object.keys(normalizedBlock ?? {}),
    } satisfies PreviewStateStructuredContent,
    content: `Applied preview overrides to ${fixtureSummary.label}.`,
  };
}

export function extractPreviewCatalog(
  result: ToolResult | CallToolResponse | null | undefined,
): PreviewBlocksStructuredContent | null {
  const structuredContent = result?.structuredContent;
  if (
    !isRecord(structuredContent) ||
    !Array.isArray(structuredContent.blocks)
  ) {
    return null;
  }

  return structuredContent as PreviewBlocksStructuredContent;
}

export function extractPreviewState(
  result: ToolResult | CallToolResponse | null | undefined,
): ServiceGridPreviewWidgetState | null | undefined {
  const structuredContent = result?.structuredContent;
  if (!isRecord(structuredContent)) {
    return undefined;
  }

  if (structuredContent.previewState === null) {
    return null;
  }

  if (isRecord(structuredContent.previewState)) {
    return structuredContent.previewState as ServiceGridPreviewWidgetState;
  }

  const blockType = normalizeBlockType(structuredContent.blockType);
  const fixtureResult = resolveFixtureId(structuredContent.fixtureId);
  if (!blockType || "error" in fixtureResult) {
    return undefined;
  }

  return {
    blockType,
    fixtureId: fixtureResult.fixtureId,
    block: normalizeBlockOverrides(structuredContent.block),
  };
}

export function resolveServiceGridWorkbenchInput(
  input: ServiceGridWorkbenchInput | null | undefined,
  widgetState: ServiceGridPreviewWidgetState | null | undefined,
): ServiceGridWorkbenchInput {
  const normalizedInput = input ?? {};
  const normalizedWidgetState =
    widgetState?.blockType === "serviceGrid" ? widgetState : null;

  const baseBlock = normalizeBlockOverrides(normalizedInput.block);
  const widgetBlock = normalizeBlockOverrides(normalizedWidgetState?.block);

  return {
    fixtureId:
      normalizedWidgetState?.fixtureId ??
      normalizedInput.fixtureId ??
      blockFixtureRegistry.serviceGrid.defaultFixtureId,
    block:
      baseBlock || widgetBlock
        ? {
            ...baseBlock,
            ...widgetBlock,
            services: widgetBlock?.services ?? baseBlock?.services,
          }
        : undefined,
  };
}

export function resolveServiceGridBlock(
  input: ServiceGridWorkbenchInput | null | undefined,
  widgetState: ServiceGridPreviewWidgetState | null | undefined,
): ServiceGridBlockFixture {
  const resolvedInput = resolveServiceGridWorkbenchInput(input, widgetState);
  const base = getBlockFixture("serviceGrid", resolvedInput.fixtureId);
  const overrides = resolvedInput.block;

  if (!overrides) {
    return base;
  }

  return {
    ...base,
    ...overrides,
    services: overrides.services ?? base.services,
  };
}
