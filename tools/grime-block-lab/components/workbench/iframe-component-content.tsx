"use client";

import { useEffect, useRef, useState } from "react";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { cn } from "@/lib/ui/cn";
import {
  buildHmrPreviewPath,
  useWidgetBundle,
  WidgetIframeHost,
} from "@/lib/workbench/iframe";
import {
  useSelectedComponent,
  useToolInput,
  useWorkbenchStore,
} from "@/lib/workbench/store";
import { ComponentErrorBoundary } from "./component-error-boundary";
import { IsolatedThemeWrapper } from "./isolated-theme-wrapper";

const LOADING_APPEAR_DELAY_MS = 1200;
const LOADING_FADE_DURATION_MS = 220;

function LoadingState({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        "flex h-full w-full grow items-center justify-center p-8 transition-opacity",
        visible ? "opacity-100 duration-300" : "opacity-0 duration-200",
      )}
    >
      <div className="pointer-events-none text-center">
        <div className="text-muted-foreground text-sm">Preparing widget...</div>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-background p-8">
      <div className="text-center">
        <div className="font-medium text-destructive text-sm">Bundle Error</div>
        <div className="mt-1 max-w-md text-muted-foreground text-xs">
          {error}
        </div>
      </div>
    </div>
  );
}

function IframeComponentRenderer() {
  const selectedComponent = useSelectedComponent();
  const isDemoMode = useDemoMode();
  const setHmrRuntimeStatus = useWorkbenchStore((s) => s.setHmrRuntimeStatus);
  const hmrEligible = process.env.NODE_ENV === "development" && !isDemoMode;
  const [hmrRuntimeStatus, setLocalHmrRuntimeStatus] = useState<
    "idle" | "checking" | "ready" | "error"
  >(hmrEligible ? "checking" : "idle");
  const hmrActive = hmrEligible && hmrRuntimeStatus !== "error";
  const { loading, error, bundle } = useWidgetBundle(selectedComponent, {
    enabled: !hmrActive,
  });
  const [showLoading, setShowLoading] = useState(false);
  const [loadingVisible, setLoadingVisible] = useState(false);
  const appearTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const currentLocationSearch =
    typeof window === "undefined" ? "" : window.location.search;
  const hmrSrc = hmrActive
    ? buildHmrPreviewPath(selectedComponent, currentLocationSearch)
    : null;

  useEffect(() => {
    if (!hmrEligible) {
      setLocalHmrRuntimeStatus("idle");
      setHmrRuntimeStatus("idle", null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLocalHmrRuntimeStatus("checking");
    setHmrRuntimeStatus("checking", null);
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 2500);

    async function checkRuntime() {
      try {
        const response = await fetch("/__workbench_hmr/@vite/client", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`runtime returned HTTP ${response.status}`);
        }
        if (!cancelled) {
          setLocalHmrRuntimeStatus("ready");
          setHmrRuntimeStatus("ready", null);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (!cancelled) {
          setLocalHmrRuntimeStatus("error");
          setHmrRuntimeStatus(
            "error",
            `HMR runtime unavailable (${message}). Run \`pnpm dev\`, verify \`/__workbench_hmr/@vite/client\`, then refresh.`,
          );
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    void checkRuntime();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
      setHmrRuntimeStatus("idle", null);
    };
  }, [hmrEligible, setHmrRuntimeStatus]);

  useEffect(() => {
    if (appearTimerRef.current !== null) {
      window.clearTimeout(appearTimerRef.current);
      appearTimerRef.current = null;
    }
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (!hmrActive && loading) {
      setShowLoading(true);
      setLoadingVisible(false);
      appearTimerRef.current = window.setTimeout(() => {
        setLoadingVisible(true);
      }, LOADING_APPEAR_DELAY_MS);
      return;
    }

    setLoadingVisible(false);
    hideTimerRef.current = window.setTimeout(() => {
      setShowLoading(false);
    }, LOADING_FADE_DURATION_MS);
  }, [loading, hmrActive]);

  useEffect(
    () => () => {
      if (appearTimerRef.current !== null) {
        window.clearTimeout(appearTimerRef.current);
      }
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
    },
    [],
  );

  if (showLoading) {
    return (
      <IsolatedThemeWrapper className="flex h-full w-full">
        <LoadingState visible={loadingVisible} />
      </IsolatedThemeWrapper>
    );
  }

  if (!hmrActive && error) {
    return (
      <IsolatedThemeWrapper className="flex h-full w-full">
        <ErrorState error={error} />
      </IsolatedThemeWrapper>
    );
  }

  return (
    <IsolatedThemeWrapper className="flex h-full w-full">
      <WidgetIframeHost
        widgetBundle={bundle}
        hmrSrc={hmrSrc}
        className="h-full w-full"
        demoMode={isDemoMode}
      />
    </IsolatedThemeWrapper>
  );
}

export function IframeComponentContent({ className }: { className?: string }) {
  const toolInput = useToolInput();

  return (
    <div className={cn("h-full w-full", className)}>
      <ComponentErrorBoundary toolInput={toolInput}>
        <IframeComponentRenderer />
      </ComponentErrorBoundary>
    </div>
  );
}
