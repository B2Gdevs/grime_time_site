"use client";

import { useCallback } from "react";
import {
  useIsTransitioning,
  useIsWidgetClosed,
  useSelectedComponent,
  useWorkbenchStore,
} from "@/lib/workbench/store";
import { VIEW_TRANSITION_PARENT_NAME } from "@/lib/workbench/transition-config";
import { ModalOverlay } from "./modal-overlay";
import { PreviewToolbar } from "./preview-toolbar";
import { PreviewContent } from "./preview-views";
import { WidgetClosedOverlay } from "./widget-closed-overlay";

const COMPONENTS_WITH_OWN_MODAL = new Set<string>();

export function PreviewPanel() {
  const isTransitioning = useIsTransitioning();
  const isWidgetClosed = useIsWidgetClosed();
  const setWidgetClosed = useWorkbenchStore((s) => s.setWidgetClosed);
  const view = useWorkbenchStore((s) => s.view);
  const setView = useWorkbenchStore((s) => s.setView);
  const selectedComponent = useSelectedComponent();

  const handleReopenWidget = useCallback(() => {
    setWidgetClosed(false);
  }, [setWidgetClosed]);

  const handleModalClose = useCallback(() => {
    setView(null);
  }, [setView]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-lg border">
      <PreviewToolbar />
      <div
        className="relative min-h-0 flex-1"
        style={
          {
            viewTransitionName: isTransitioning
              ? VIEW_TRANSITION_PARENT_NAME
              : undefined,
          } as React.CSSProperties
        }
      >
        <PreviewContent />
        {isWidgetClosed && (
          <WidgetClosedOverlay onReopen={handleReopenWidget} />
        )}
        {view?.mode === "modal" &&
          !COMPONENTS_WITH_OWN_MODAL.has(selectedComponent) && (
            <ModalOverlay view={view} onClose={handleModalClose} />
          )}
      </div>
    </div>
  );
}
