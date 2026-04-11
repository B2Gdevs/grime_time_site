/// <reference types="vite/client" />

import React from "react";
import { createRoot } from "react-dom/client";
import "@/app/globals.css";
import { ProductionProvider } from "@/lib/export/production-provider";
import { componentConfigs } from "@/lib/workbench/component-configs";
import { installOpenAIShim } from "@/lib/workbench/iframe/openai-shim-runtime";

type WidgetModule = Record<string, unknown>;
type WidgetComponent = React.ComponentType;

const moduleLoaders = import.meta.glob<WidgetModule>([
  "/lib/workbench/wrappers/**/*.{ts,tsx}",
  "/lib/workbench/demo/**/*.{ts,tsx}",
]);

function getComponentConfig(
  componentId: string,
  demoMode: boolean,
): { entryPoint: string; exportName: string; useProvider: boolean } | null {
  const matched = componentConfigs.find((c) => c.id === componentId);
  if (!matched) return null;

  if (demoMode) {
    if (!matched.demoConfig) return null;
    return {
      entryPoint: matched.demoConfig.entryPoint,
      exportName: matched.demoConfig.exportName,
      useProvider: false,
    };
  }

  return {
    entryPoint: matched.exportConfig.entryPoint,
    exportName: matched.exportConfig.exportName,
    useProvider: true,
  };
}

async function loadWidgetComponent(
  componentId: string,
  demoMode: boolean,
): Promise<{ Widget: WidgetComponent; useProvider: boolean }> {
  const config = getComponentConfig(componentId, demoMode);
  if (!config) {
    throw new Error(`Unknown component: ${componentId}`);
  }

  const modulePath = `/${config.entryPoint}`;
  const loader = moduleLoaders[modulePath];
  if (!loader) {
    throw new Error(
      `Component entry "${config.entryPoint}" is not available in Vite runtime.`,
    );
  }

  const mod = await loader();
  const exported = mod[config.exportName] as WidgetComponent | undefined;
  if (!exported) {
    throw new Error(
      `Export "${config.exportName}" was not found in "${config.entryPoint}".`,
    );
  }
  return { Widget: exported, useProvider: config.useProvider };
}

function renderError(message: string) {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;
  const root = createRoot(rootElement);
  root.render(
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--foreground)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        padding: "1rem",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "640px" }}>
        <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
          Workbench HMR Runtime Error
        </div>
        <div style={{ opacity: 0.8, fontSize: "12px" }}>{message}</div>
      </div>
    </div>,
  );
}

async function main() {
  installOpenAIShim();

  const params = new URLSearchParams(window.location.search);
  const componentId = params.get("component") ?? "welcome";
  const demoMode = params.get("demo") === "true";
  const { Widget, useProvider } = await loadWidgetComponent(
    componentId,
    demoMode,
  );

  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  const root = createRoot(rootElement);
  if (useProvider) {
    root.render(
      <ProductionProvider>
        <Widget />
      </ProductionProvider>,
    );
    return;
  }

  root.render(<Widget />);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  renderError(message);
});
