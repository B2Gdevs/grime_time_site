"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { componentConfigs } from "./component-configs";
import type {
  MockConfigState,
  MockResponse,
  MockVariant,
  ToolAnnotations,
  ToolDescriptorMeta,
  ToolMockConfig,
  ToolSchemas,
  ToolSource,
} from "./mock-config";
import {
  createEmptyMockConfigState,
  createToolMockConfig,
} from "./mock-config";
import { withPreviewToolDefinitions } from "./preview-tools";
import type {
  ConsoleEntry,
  ConsoleEntryType,
  DeviceType,
  DisplayMode,
  OpenAIGlobals,
  SafeAreaInsets,
  SimulationState,
  Theme,
  ToolSimulationConfig,
  UserLocation,
  View,
  WidgetState,
} from "./types";
import {
  DEFAULT_SIMULATION_STATE,
  DEFAULT_TOOL_CONFIG,
  DEVICE_PRESETS,
} from "./types";

interface ActiveToolCall {
  toolName: string;
  delay: number;
  startTime: number;
  isHanging?: boolean;
  cancelFn?: () => void;
}

export type RightPanelTab = "activity" | "simulation";

interface WorkbenchState {
  selectedComponent: string;
  displayMode: DisplayMode;
  previousDisplayMode: DisplayMode;
  // Global shell/chrome theme (header, side panels, surrounding app UI).
  theme: Theme;
  // Preview/runtime theme for widget simulation; intentionally independent.
  previewTheme: Theme;
  locale: string;
  deviceType: DeviceType;
  resizableWidth: number;
  toolInput: Record<string, unknown>;
  toolOutput: Record<string, unknown> | null;
  widgetState: WidgetState;
  maxHeight: number;
  intrinsicHeight: number | null;
  toolResponseMetadata: Record<string, unknown> | null;
  safeAreaInsets: SafeAreaInsets;
  consoleLogs: ConsoleEntry[];
  collapsedSections: Record<string, boolean>;
  isTransitioning: boolean;
  transitionFrom: DisplayMode | null;
  view: View | null;
  mockConfig: MockConfigState;
  userLocation: UserLocation | null;
  isWidgetClosed: boolean;
  widgetSessionId: string;
  activeToolCall: ActiveToolCall | null;
  isConsoleOpen: boolean;
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  rightPanelTab: RightPanelTab;
  isSDKGuideOpen: boolean;
  simulation: SimulationState;
  conversationMode: boolean;
  hmrRuntimeStatus: "idle" | "checking" | "ready" | "error";
  hmrRuntimeMessage: string | null;

  setSelectedComponent: (componentId: string) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setTransitioning: (transitioning: boolean) => void;
  setTheme: (theme: Theme) => void;
  setPreviewTheme: (theme: Theme) => void;
  setLocale: (locale: string) => void;
  setDeviceType: (type: DeviceType) => void;
  setToolInput: (input: Record<string, unknown>) => void;
  setToolOutput: (output: Record<string, unknown> | null) => void;
  setWidgetState: (state: WidgetState) => void;
  updateWidgetState: (state: Record<string, unknown>) => void;
  setMaxHeight: (height: number) => void;
  setIntrinsicHeight: (height: number | null) => void;
  setToolResponseMetadata: (metadata: Record<string, unknown> | null) => void;
  setSafeAreaInsets: (insets: Partial<SafeAreaInsets>) => void;
  addConsoleEntry: (entry: {
    type: ConsoleEntryType;
    method: string;
    args?: unknown;
    result?: unknown;
  }) => void;
  clearConsole: () => void;
  restoreConsoleLogs: (entries: ConsoleEntry[]) => void;
  toggleSection: (section: string) => void;
  setView: (view: View | null) => void;
  getOpenAIGlobals: () => OpenAIGlobals;
  setUserLocation: (location: UserLocation | null) => void;
  setWidgetClosed: (closed: boolean) => void;
  setActiveToolCall: (call: ActiveToolCall | null) => void;
  cancelActiveToolCall: () => void;
  setConsoleOpen: (open: boolean) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setSDKGuideOpen: (open: boolean) => void;
  setResizableWidth: (width: number) => void;
  selectSimTool: (toolName: string | null) => void;
  registerSimTool: (toolName: string) => void;
  setSimToolConfig: (
    toolName: string,
    config: Partial<ToolSimulationConfig>,
  ) => void;

  setMocksEnabled: (enabled: boolean) => void;
  setServerUrl: (url: string) => void;
  setToolSource: (toolName: string, source: ToolSource) => void;
  registerTool: (toolName: string) => void;
  registerToolsFromServer: (
    tools: Array<{
      name: string;
      description?: string;
      inputSchema?: Record<string, unknown>;
    }>,
  ) => void;
  removeTool: (toolName: string) => void;
  setActiveVariant: (toolName: string, variantId: string | null) => void;
  setInterceptMode: (toolName: string, enabled: boolean) => void;
  addVariant: (toolName: string, variant: MockVariant) => void;
  updateVariant: (
    toolName: string,
    variantId: string,
    updates: Partial<MockVariant>,
  ) => void;
  removeVariant: (toolName: string, variantId: string) => void;
  updateToolResponse: (toolName: string, response: MockResponse) => void;
  setMockConfig: (config: MockConfigState) => void;
  setToolAnnotations: (toolName: string, annotations: ToolAnnotations) => void;
  setToolDescriptorMeta: (toolName: string, meta: ToolDescriptorMeta) => void;
  setToolSchemas: (toolName: string, schemas: ToolSchemas) => void;
  setConversationMode: (enabled: boolean) => void;
  setHmrRuntimeStatus: (
    status: "idle" | "checking" | "ready" | "error",
    message?: string | null,
  ) => void;
}

function buildOpenAIGlobals(
  state: Pick<
    WorkbenchState,
    | "theme"
    | "previewTheme"
    | "locale"
    | "displayMode"
    | "previousDisplayMode"
    | "maxHeight"
    | "toolInput"
    | "toolOutput"
    | "toolResponseMetadata"
    | "widgetState"
    | "deviceType"
    | "safeAreaInsets"
    | "view"
    | "userLocation"
  >,
): OpenAIGlobals {
  const preset = DEVICE_PRESETS[state.deviceType];

  return {
    theme: state.previewTheme,
    locale: state.locale,
    displayMode: state.displayMode,
    previousDisplayMode: state.previousDisplayMode,
    maxHeight: state.maxHeight,
    toolInput: state.toolInput,
    toolOutput: state.toolOutput,
    toolResponseMetadata: state.toolResponseMetadata,
    widgetState: state.widgetState,
    userAgent: preset.userAgent,
    safeArea: {
      insets: state.safeAreaInsets,
    },
    view: state.view,
    userLocation: state.userLocation,
  };
}

const DEFAULT_COMPONENT = componentConfigs[0]?.id ?? "welcome";
const VALID_COMPONENT_IDS = new Set(
  componentConfigs.map((config) => config.id),
);

function normalizeComponentId(componentId: string): string {
  return VALID_COMPONENT_IDS.has(componentId) ? componentId : DEFAULT_COMPONENT;
}

function getInitialTheme(): Theme {
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  }
  return "light";
}

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
  selectedComponent: DEFAULT_COMPONENT,
  displayMode: "inline",
  previousDisplayMode: "inline",
  theme: getInitialTheme(),
  previewTheme: getInitialTheme(),
  locale: "en-US",
  deviceType: "desktop",
  resizableWidth: 500,
  toolInput: {},
  toolOutput: null,
  widgetState: null,
  maxHeight: 400,
  intrinsicHeight: null,
  toolResponseMetadata: null,
  safeAreaInsets: { top: 10, bottom: 100, left: 10, right: 10 },
  consoleLogs: [],
  collapsedSections: {},
  isTransitioning: false,
  transitionFrom: null,
  view: null,
  mockConfig: withPreviewToolDefinitions(createEmptyMockConfigState()),
  userLocation: null,
  isWidgetClosed: false,
  widgetSessionId: crypto.randomUUID(),
  activeToolCall: null,
  isConsoleOpen: false,
  isLeftPanelOpen: true,
  isRightPanelOpen: true,
  rightPanelTab: "activity",
  isSDKGuideOpen: false,
  simulation: DEFAULT_SIMULATION_STATE,
  conversationMode: false,
  hmrRuntimeStatus: "idle",
  hmrRuntimeMessage: null,
  setSelectedComponent: (componentId) =>
    set(() => ({ selectedComponent: normalizeComponentId(componentId) })),
  setDisplayMode: (mode) =>
    set((state) => {
      if (mode === "fullscreen" && state.displayMode !== "fullscreen") {
        return { displayMode: mode, previousDisplayMode: state.displayMode };
      }
      return { displayMode: mode };
    }),
  setTransitioning: (transitioning) =>
    set((state) => ({
      isTransitioning: transitioning,
      transitionFrom: transitioning ? state.displayMode : null,
    })),
  // Intentionally does not mutate previewTheme.
  setTheme: (theme) => set(() => ({ theme })),
  setPreviewTheme: (theme) => set(() => ({ previewTheme: theme })),
  setLocale: (locale) => set(() => ({ locale })),
  setDeviceType: (type) =>
    set((state) => {
      if (type === "resizable" && state.deviceType !== "resizable") {
        const previousPreset = DEVICE_PRESETS[state.deviceType];
        const previousWidth =
          typeof previousPreset.width === "number" ? previousPreset.width : 500;
        return { deviceType: type, resizableWidth: previousWidth };
      }
      return { deviceType: type };
    }),
  setToolInput: (input) => set(() => ({ toolInput: input })),
  setToolOutput: (output) => set(() => ({ toolOutput: output })),
  setWidgetState: (state) => set(() => ({ widgetState: state })),
  updateWidgetState: (state) =>
    set((prev) => {
      // Create a deep merge helper specifically for object state
      function isObject(item: unknown): item is Record<string, unknown> {
        return Boolean(
          item && typeof item === "object" && !Array.isArray(item),
        );
      }

      function mergeDeep(
        target: Record<string, unknown>,
        source: Record<string, unknown>,
      ): Record<string, unknown> {
        const output = Object.assign({}, target);
        if (isObject(target) && isObject(source)) {
          Object.keys(source).forEach((key) => {
            if (isObject(source[key])) {
              if (!(key in target)) {
                Object.assign(output, { [key]: source[key] });
              } else {
                output[key] = mergeDeep(
                  target[key] as Record<string, unknown>,
                  source[key] as Record<string, unknown>,
                );
              }
            } else {
              Object.assign(output, { [key]: source[key] });
            }
          });
        }
        return output;
      }

      return {
        widgetState: mergeDeep(
          (prev.widgetState ?? {}) as Record<string, unknown>,
          state,
        ),
      };
    }),
  setMaxHeight: (height) => set(() => ({ maxHeight: height })),
  setIntrinsicHeight: (height) => set(() => ({ intrinsicHeight: height })),
  setToolResponseMetadata: (metadata) =>
    set(() => ({ toolResponseMetadata: metadata })),
  setSafeAreaInsets: (insets) =>
    set((prev) => ({
      safeAreaInsets: { ...prev.safeAreaInsets, ...insets },
    })),
  addConsoleEntry: (entry) =>
    set((state) => {
      const MAX_CONSOLE_ENTRIES = 500;
      const newEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };
      const logs = [...state.consoleLogs, newEntry];
      return {
        consoleLogs:
          logs.length > MAX_CONSOLE_ENTRIES
            ? logs.slice(logs.length - MAX_CONSOLE_ENTRIES)
            : logs,
      };
    }),
  clearConsole: () => set(() => ({ consoleLogs: [] })),
  restoreConsoleLogs: (entries) => set(() => ({ consoleLogs: entries })),
  toggleSection: (section) =>
    set((state) => ({
      collapsedSections: {
        ...state.collapsedSections,
        [section]: !state.collapsedSections[section],
      },
    })),
  setView: (view) => set(() => ({ view })),
  getOpenAIGlobals: () => {
    const state = get();
    return buildOpenAIGlobals(state);
  },
  setUserLocation: (location) => set(() => ({ userLocation: location })),
  setWidgetClosed: (closed) => set(() => ({ isWidgetClosed: closed })),
  setActiveToolCall: (call) => set(() => ({ activeToolCall: call })),
  cancelActiveToolCall: () => {
    const { activeToolCall } = get();
    if (activeToolCall?.cancelFn) {
      activeToolCall.cancelFn();
    }
    set(() => ({ activeToolCall: null }));
  },
  setConsoleOpen: (open) => set(() => ({ isConsoleOpen: open })),
  setLeftPanelOpen: (open) => set(() => ({ isLeftPanelOpen: open })),
  setRightPanelOpen: (open) => set(() => ({ isRightPanelOpen: open })),
  setRightPanelTab: (tab) => set(() => ({ rightPanelTab: tab })),
  setSDKGuideOpen: (open) => set(() => ({ isSDKGuideOpen: open })),
  setResizableWidth: (width) => set(() => ({ resizableWidth: width })),
  setConversationMode: (enabled) => set(() => ({ conversationMode: enabled })),
  setHmrRuntimeStatus: (status, message = null) =>
    set(() => ({ hmrRuntimeStatus: status, hmrRuntimeMessage: message })),
  selectSimTool: (toolName) =>
    set((state) => ({
      simulation: { ...state.simulation, selectedTool: toolName },
    })),
  registerSimTool: (toolName) =>
    set((state) => {
      if (state.simulation.tools[toolName]) return state;
      return {
        simulation: {
          ...state.simulation,
          tools: {
            ...state.simulation.tools,
            [toolName]: { ...DEFAULT_TOOL_CONFIG },
          },
        },
      };
    }),
  setSimToolConfig: (toolName, config) =>
    set((state) => {
      const existing = state.simulation.tools[toolName] ?? DEFAULT_TOOL_CONFIG;
      return {
        simulation: {
          ...state.simulation,
          tools: {
            ...state.simulation.tools,
            [toolName]: { ...existing, ...config },
          },
        },
      };
    }),

  setMocksEnabled: (enabled) =>
    set((state) => ({
      mockConfig: { ...state.mockConfig, globalEnabled: enabled },
    })),

  setServerUrl: (url) =>
    set((state) => ({
      mockConfig: { ...state.mockConfig, serverUrl: url },
    })),

  setToolSource: (toolName, source) =>
    set((state) => {
      const tool = state.mockConfig.tools[toolName];
      if (!tool) return state;
      return {
        mockConfig: {
          ...state.mockConfig,
          tools: {
            ...state.mockConfig.tools,
            [toolName]: { ...tool, source },
          },
        },
      };
    }),

  registerTool: (toolName) =>
    set((state) => {
      if (state.mockConfig.tools[toolName]) {
        return state;
      }
      return {
        mockConfig: {
          ...state.mockConfig,
          tools: {
            ...state.mockConfig.tools,
            [toolName]: createToolMockConfig(toolName),
          },
        },
      };
    }),

  registerToolsFromServer: (tools) =>
    set((state) => {
      const newTools: Record<string, ToolMockConfig> = {};
      for (const tool of tools) {
        if (!state.mockConfig.tools[tool.name]) {
          const config = createToolMockConfig(tool.name);
          config.source = "server";
          if (tool.inputSchema) {
            config.schemas = { inputSchema: tool.inputSchema };
          }
          newTools[tool.name] = config;
        }
      }
      if (Object.keys(newTools).length === 0) {
        return state;
      }
      return {
        mockConfig: {
          ...state.mockConfig,
          tools: {
            ...state.mockConfig.tools,
            ...newTools,
          },
        },
      };
    }),

  removeTool: (toolName) =>
    set((state) => {
      const { [toolName]: _removed, ...remainingTools } =
        state.mockConfig.tools;
      return {
        mockConfig: {
          ...state.mockConfig,
          tools: remainingTools,
        },
      };
    }),

  setActiveVariant: (toolName, variantId) =>
    set((state) => {
      const tool = state.mockConfig.tools[toolName];
      if (!tool) return state;
      return {
        mockConfig: {
          ...state.mockConfig,
          tools: {
            ...state.mockConfig.tools,
            [toolName]: { ...tool, activeVariantId: variantId },
          },
        },
      };
    }),

  setInterceptMode: (toolName, enabled) =>
    set((state) => {
      const tool = state.mockConfig.tools[toolName];
      if (!tool) return state;
      return {
        mockConfig: {
          ...state.mockConfig,
          tools: {
            ...state.mockConfig.tools,
            [toolName]: { ...tool, interceptMode: enabled },
          },
        },
      };
    }),

  addVariant: (toolName, variant) =>
    set((state) => {
      const tool = state.mockConfig.tools[toolName];
      if (!tool) return state;
      return {
        mockConfig: {
          ...state.mockConfig,
          tools: {
            ...state.mockConfig.tools,
            [toolName]: {
              ...tool,
              variants: [...tool.variants, variant],
            },
          },
        },
      };
    }),

  updateVariant: (toolName, variantId, updates) =>
    set((state) => {
      const tool = state.mockConfig.tools[toolName];
      if (!tool) return state;
      return {
        mockConfig: {
          ...state.mockConfig,
          tools: {
            ...state.mockConfig.tools,
            [toolName]: {
              ...tool,
              variants: tool.variants.map((v) =>
                v.id === variantId ? { ...v, ...updates } : v,
              ),
            },
          },
        },
      };
    }),

  removeVariant: (toolName, variantId) =>
    set((state) => {
      const tool = state.mockConfig.tools[toolName];
      if (!tool) return state;
      const newActiveId =
        tool.activeVariantId === variantId ? null : tool.activeVariantId;
      return {
        mockConfig: {
          ...state.mockConfig,
          tools: {
            ...state.mockConfig.tools,
            [toolName]: {
              ...tool,
              activeVariantId: newActiveId,
              variants: tool.variants.filter((v) => v.id !== variantId),
            },
          },
        },
      };
    }),

  updateToolResponse: (toolName, response) =>
    set((state) => {
      const tool = state.mockConfig.tools[toolName];
      if (!tool) return state;
      return {
        mockConfig: {
          ...state.mockConfig,
          tools: {
            ...state.mockConfig.tools,
            [toolName]: { ...tool, mockResponse: response },
          },
        },
      };
    }),

  setMockConfig: (config) => set(() => ({ mockConfig: config })),

  setToolAnnotations: (toolName, annotations) =>
    set((state) => {
      const tool = state.mockConfig.tools[toolName];
      if (!tool) return state;
      return {
        mockConfig: {
          ...state.mockConfig,
          tools: {
            ...state.mockConfig.tools,
            [toolName]: { ...tool, annotations },
          },
        },
      };
    }),

  setToolDescriptorMeta: (toolName, meta) =>
    set((state) => {
      const tool = state.mockConfig.tools[toolName];
      if (!tool) return state;
      return {
        mockConfig: {
          ...state.mockConfig,
          tools: {
            ...state.mockConfig.tools,
            [toolName]: { ...tool, descriptorMeta: meta },
          },
        },
      };
    }),

  setToolSchemas: (toolName, schemas) =>
    set((state) => {
      const tool = state.mockConfig.tools[toolName];
      if (!tool) return state;
      return {
        mockConfig: {
          ...state.mockConfig,
          tools: {
            ...state.mockConfig.tools,
            [toolName]: { ...tool, schemas },
          },
        },
      };
    }),
}));

export const useSelectedComponent = () =>
  useWorkbenchStore((s) => s.selectedComponent);
export const useDisplayMode = () => useWorkbenchStore((s) => s.displayMode);
export const useIsTransitioning = () =>
  useWorkbenchStore((s) => s.isTransitioning);
export const useWorkbenchTheme = () => useWorkbenchStore((s) => s.previewTheme);
export const useDeviceType = () => useWorkbenchStore((s) => s.deviceType);
export const useConsoleLogs = () => useWorkbenchStore((s) => s.consoleLogs);
export const useClearConsole = () => useWorkbenchStore((s) => s.clearConsole);
export const useToolInput = () => useWorkbenchStore((s) => s.toolInput);
export const useToolOutput = () => useWorkbenchStore((s) => s.toolOutput);
export const useMockConfig = () => useWorkbenchStore((s) => s.mockConfig);

export const useOpenAIGlobals = (): OpenAIGlobals => {
  const globalTheme = useWorkbenchStore((s) => s.theme);
  const previewTheme = useWorkbenchStore((s) => s.previewTheme);
  const locale = useWorkbenchStore((s) => s.locale);
  const displayMode = useWorkbenchStore((s) => s.displayMode);
  const previousDisplayMode = useWorkbenchStore((s) => s.previousDisplayMode);
  const maxHeight = useWorkbenchStore((s) => s.maxHeight);
  const toolInput = useWorkbenchStore((s) => s.toolInput);
  const toolOutput = useWorkbenchStore((s) => s.toolOutput);
  const toolResponseMetadata = useWorkbenchStore((s) => s.toolResponseMetadata);
  const widgetState = useWorkbenchStore((s) => s.widgetState);
  const deviceType = useWorkbenchStore((s) => s.deviceType);
  const safeAreaInsets = useWorkbenchStore((s) => s.safeAreaInsets);
  const view = useWorkbenchStore((s) => s.view);
  const userLocation = useWorkbenchStore((s) => s.userLocation);

  return useMemo(
    () =>
      buildOpenAIGlobals({
        theme: globalTheme,
        previewTheme,
        locale,
        displayMode,
        previousDisplayMode,
        maxHeight,
        toolInput,
        toolOutput,
        toolResponseMetadata,
        widgetState,
        deviceType,
        safeAreaInsets,
        view,
        userLocation,
      }),
    [
      globalTheme,
      previewTheme,
      locale,
      displayMode,
      previousDisplayMode,
      maxHeight,
      toolInput,
      toolOutput,
      toolResponseMetadata,
      widgetState,
      deviceType,
      safeAreaInsets,
      view,
      userLocation,
    ],
  );
};

export const useIsWidgetClosed = () =>
  useWorkbenchStore((s) => s.isWidgetClosed);
export const useActiveToolCall = () =>
  useWorkbenchStore((s) => s.activeToolCall);
export const useIsConsoleOpen = () => useWorkbenchStore((s) => s.isConsoleOpen);
export const useIsLeftPanelOpen = () =>
  useWorkbenchStore((s) => s.isLeftPanelOpen);
export const useIsRightPanelOpen = () =>
  useWorkbenchStore((s) => s.isRightPanelOpen);
export const useRightPanelTab = () => useWorkbenchStore((s) => s.rightPanelTab);
export const useIsSDKGuideOpen = () =>
  useWorkbenchStore((s) => s.isSDKGuideOpen);
export const useSimulation = () => useWorkbenchStore((s) => s.simulation);
export const useResizableWidth = () =>
  useWorkbenchStore((s) => s.resizableWidth);
export const useServerUrl = () =>
  useWorkbenchStore((s) => s.mockConfig.serverUrl);
export const useConversationMode = () =>
  useWorkbenchStore((s) => s.conversationMode);
export const useHmrRuntimeStatus = () =>
  useWorkbenchStore((s) => s.hmrRuntimeStatus);
export const useHmrRuntimeMessage = () =>
  useWorkbenchStore((s) => s.hmrRuntimeMessage);
