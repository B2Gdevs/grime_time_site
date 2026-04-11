"use client";

import { MessageCircle, Moon, Sun } from "lucide-react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/ui/cn";
import { getComponent } from "@/lib/workbench/component-registry";
import { useWorkbenchPersistence } from "@/lib/workbench/persistence";
import {
  useDisplayMode,
  useIsLeftPanelOpen,
  useIsRightPanelOpen,
  useIsSDKGuideOpen,
  useSelectedComponent,
  useWorkbenchStore,
} from "@/lib/workbench/store";
import { ExportPopover } from "./export-popover";
import { OnboardingModal } from "./onboarding-modal";
import { LeftPanelIcon, RightPanelIcon } from "./panel-toggle-icons";
import { WorkbenchLayout } from "./workbench-layout";

const SDKGuideModal = dynamic(
  () =>
    import("./sdk-guide/sdk-guide-modal").then(
      (module) => module.SDKGuideModal,
    ),
  {
    ssr: false,
  },
);

export function WorkbenchShell() {
  const [mounted, setMounted] = React.useState(false);
  const setDisplayMode = useWorkbenchStore((s) => s.setDisplayMode);
  const setLeftPanelOpen = useWorkbenchStore((s) => s.setLeftPanelOpen);
  const setRightPanelOpen = useWorkbenchStore((s) => s.setRightPanelOpen);
  const displayMode = useDisplayMode();
  const isLeftPanelOpen = useIsLeftPanelOpen();
  const isRightPanelOpen = useIsRightPanelOpen();
  const isSDKGuideOpen = useIsSDKGuideOpen();
  const setSDKGuideOpen = useWorkbenchStore((s) => s.setSDKGuideOpen);
  const setWorkbenchTheme = useWorkbenchStore((s) => s.setTheme);
  const { setTheme, resolvedTheme } = useTheme();
  const selectedComponentId = useSelectedComponent();
  const activeComponent = getComponent(selectedComponentId);

  const persistenceReady = useWorkbenchPersistence();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && resolvedTheme) {
      const nextTheme = resolvedTheme as "light" | "dark";
      setWorkbenchTheme(nextTheme);
    }
  }, [mounted, resolvedTheme, setWorkbenchTheme]);

  const isDark = mounted && resolvedTheme === "dark";

  const toggleTheme = React.useCallback(() => {
    if (!document.startViewTransition) {
      setTheme(isDark ? "light" : "dark");
      return;
    }
    document.startViewTransition(() => {
      setTheme(isDark ? "light" : "dark");
    });
  }, [isDark, setTheme]);

  const toggleFullscreen = React.useCallback(() => {
    setDisplayMode(displayMode === "fullscreen" ? "inline" : "fullscreen");
  }, [displayMode, setDisplayMode]);

  const toggleSDKGuide = React.useCallback(() => {
    setSDKGuideOpen(!isSDKGuideOpen);
  }, [isSDKGuideOpen, setSDKGuideOpen]);

  const toggleThemeRef = React.useRef(toggleTheme);
  const toggleFullscreenRef = React.useRef(toggleFullscreen);
  const toggleSDKGuideRef = React.useRef(toggleSDKGuide);
  toggleThemeRef.current = toggleTheme;
  toggleFullscreenRef.current = toggleFullscreen;
  toggleSDKGuideRef.current = toggleSDKGuide;

  React.useEffect(() => {
    const isMac = /mac/i.test(navigator.userAgent);

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        toggleThemeRef.current();
      }

      if (modKey && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreenRef.current();
      }

      if (modKey && e.key === "/") {
        e.preventDefault();
        toggleSDKGuideRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <LogoMark className="size-5 shrink-0" />
          <span className="select-none font-mono">Grime Time Block Lab</span>
        </div>

        <span className="font-medium text-sm">
          {activeComponent?.label ?? "MCP App"}
        </span>

        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle left panel"
            aria-pressed={isLeftPanelOpen}
            className="size-7 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setLeftPanelOpen(!isLeftPanelOpen)}
          >
            <LeftPanelIcon active={isLeftPanelOpen} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle simulation panel"
            aria-pressed={isRightPanelOpen}
            className="size-7 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setRightPanelOpen(!isRightPanelOpen)}
          >
            <RightPanelIcon active={isRightPanelOpen} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle workbench theme"
            aria-pressed={isDark}
            className="relative size-7 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={toggleTheme}
          >
            <Sun
              className={cn(
                "size-4 transition-all",
                isDark ? "rotate-90 scale-0" : "rotate-0 scale-100",
              )}
            />
            <Moon
              className={cn(
                "absolute size-4 transition-all",
                isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0",
              )}
            />
          </Button>

          <div className="mx-2 h-4 w-px bg-border" />

          <Button
            variant="ghost"
            aria-label="Assistant (⌘/)"
            className="h-7 gap-1.5 rounded-md px-2 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
            onClick={toggleSDKGuide}
          >
            <MessageCircle className="size-4" />
            <span>Studio Guide</span>
          </Button>

          <ExportPopover />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {persistenceReady ? (
          <WorkbenchLayout />
        ) : (
          <div className="h-full w-full bg-background" />
        )}
      </div>
      <OnboardingModal />
      {isSDKGuideOpen ? <SDKGuideModal /> : null}
    </div>
  );
}
