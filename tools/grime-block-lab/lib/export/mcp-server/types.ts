import type {
  MockResponse,
  ToolAnnotations,
  ToolDescriptorMeta,
} from "../../workbench/mock-config/types";

export interface MCPToolConfig {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: ToolAnnotations;
  meta?: ToolDescriptorMeta;
  defaultResponse?: MockResponse;
}

export interface MCPServerConfig {
  name: string;
  version: string;
  tools: MCPToolConfig[];
  widgetHtml?: string;
  widgetUrl?: string;
  widgetResourceMeta?: WidgetResourceMeta;
}

export interface WidgetResourceCsp {
  connectDomains?: string[];
  resourceDomains?: string[];
  frameDomains?: string[];
  baseUriDomains?: string[];
}

export interface WidgetResourceMeta {
  ui?: {
    csp?: WidgetResourceCsp;
    prefersBorder?: boolean;
    domain?: string;
  };
}

export interface MCPServerGeneratorOptions {
  config: MCPServerConfig;
  outputDir: string;
  includeExampleHandlers?: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface MCPServerGeneratorResult {
  success: boolean;
  files: GeneratedFile[];
  errors: string[];
}
