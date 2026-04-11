/**
 * Shared component configuration data.
 *
 * This is the single source of truth for component ID → entry point mappings.
 * Used by both the client-side component-registry and the Node-side bundle map.
 *
 * Keep this file free of React, Node, or browser-specific imports so it can
 * be consumed in any environment.
 */

export interface ComponentExportConfig {
  entryPoint: string;
  exportName: string;
}

export interface ComponentMeta {
  id: string;
  label: string;
  description: string;
  category: "cards" | "lists" | "forms" | "data";
  exportConfig: ComponentExportConfig;
  demoConfig?: {
    entryPoint: string;
    exportName: string;
  };
}

export const componentConfigs: ComponentMeta[] = [
  {
    id: "service-grid",
    label: "Service Grid",
    description:
      "Fixture-driven preview of the Grime Time service grid block with mock copy and media.",
    category: "lists",
    exportConfig: {
      entryPoint: "lib/workbench/wrappers/service-grid-sdk.tsx",
      exportName: "ServiceGridSDK",
    },
    demoConfig: {
      entryPoint: "lib/workbench/demo/service-grid-demo.tsx",
      exportName: "ServiceGridDemo",
    },
  },
];
