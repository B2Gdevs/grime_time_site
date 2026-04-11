"use client";

import {
  Layers3Icon,
  LoaderCircleIcon,
  RotateCcwIcon,
  WandSparklesIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { ServiceGridPreview } from "@/components/blocks/service-grid-preview";
import { Button } from "@/components/ui/button";
import { useCallTool, useTheme, useToolInput, useWidgetState } from "@/lib/sdk";
import { cn } from "@/lib/ui/cn";
import type { ServiceGridWorkbenchInput } from "@/lib/workbench/demo/default-props";
import {
  createSamplePreviewOverride,
  extractPreviewCatalog,
  extractPreviewState,
  getServiceGridFixtureSummaries,
  resolveServiceGridBlock,
  resolveServiceGridWorkbenchInput,
  type ServiceGridFixtureSummary,
  type ServiceGridPreviewWidgetState,
} from "@/lib/workbench/preview-tools";

function getResultMessage(result: { content?: unknown }): string | null {
  return typeof result.content === "string" ? result.content : null;
}

function StatusChip({
  active = false,
  children,
}: {
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 font-medium text-[0.7rem] uppercase tracking-[0.16em]",
        active
          ? "border-primary/40 bg-primary/12 text-primary"
          : "border-border/70 bg-background/75 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

interface ServiceGridReviewToolbarProps {
  fixtures: ServiceGridFixtureSummary[];
  currentFixtureId?: ServiceGridFixtureSummary["fixtureId"];
  hasToolState: boolean;
  statusMessage: string | null;
  pendingAction: string | null;
  onListBlocks: () => Promise<void>;
  onSetFixture: (
    fixtureId: ServiceGridFixtureSummary["fixtureId"],
  ) => Promise<void>;
  onApplyOverride: () => Promise<void>;
  onClearToolState: () => void;
}

function ServiceGridReviewToolbar({
  fixtures,
  currentFixtureId,
  hasToolState,
  statusMessage,
  pendingAction,
  onListBlocks,
  onSetFixture,
  onApplyOverride,
  onClearToolState,
}: ServiceGridReviewToolbarProps) {
  return (
    <div className="rounded-[1.6rem] border border-border/70 bg-background/84 p-4 shadow-[0_18px_70px_-52px_rgba(2,6,23,0.88)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-semibold text-[0.68rem] text-primary/80 uppercase tracking-[0.34em]">
            App Studio review controls
          </p>
          <h3 className="mt-3 font-semibold text-2xl text-foreground tracking-tight">
            Tool-driven fixture switching
          </h3>
          <p className="mt-3 max-w-xl text-muted-foreground text-sm leading-7">
            Keep the base fixture in tool input, then layer review changes
            through host state. That makes it easy to compare mock JSON, fixture
            variants, and media treatments without rebuilding the live block
            stack.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            className="gap-2"
            disabled={pendingAction !== null}
            onClick={() => void onListBlocks()}
            type="button"
            variant="outline"
          >
            {pendingAction === "list_blocks" ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <Layers3Icon className="size-4" />
            )}
            List blocks
          </Button>
          <Button
            className="gap-2"
            disabled={pendingAction !== null}
            onClick={() => void onApplyOverride()}
            type="button"
            variant="outline"
          >
            {pendingAction === "apply_preview_overrides" ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <WandSparklesIcon className="size-4" />
            )}
            Sample override
          </Button>
          <Button
            className="gap-2"
            disabled={pendingAction !== null}
            onClick={onClearToolState}
            type="button"
            variant="outline"
          >
            <RotateCcwIcon className="size-4" />
            Clear host state
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {fixtures.map((fixture) => {
          const isActive = fixture.fixtureId === currentFixtureId;
          const isPending = pendingAction === fixture.fixtureId;

          return (
            <button
              className={cn(
                "rounded-full border px-4 py-2 text-left transition",
                isActive
                  ? "border-primary/45 bg-primary/12 text-foreground"
                  : "border-border/70 bg-background/78 text-muted-foreground hover:border-border hover:text-foreground",
              )}
              disabled={pendingAction !== null}
              key={fixture.fixtureId}
              onClick={() => void onSetFixture(fixture.fixtureId)}
              type="button"
            >
              <span className="block font-semibold text-[0.66rem] uppercase tracking-[0.24em]">
                {fixture.label}
              </span>
              <span className="mt-1 block text-[0.78rem]">
                {fixture.serviceCount} rows
                {fixture.hasMedia ? " / media" : " / text-only"}
                {isPending ? " / loading" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <StatusChip active>
          Fixture {currentFixtureId ?? "interactive"}
        </StatusChip>
        <StatusChip active={hasToolState}>
          {hasToolState ? "Tool state active" : "Tool input only"}
        </StatusChip>
        <StatusChip>Widget state channel</StatusChip>
      </div>

      {statusMessage ? (
        <p className="mt-4 text-foreground/82 text-sm leading-6">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}

export function ServiceGridSDK() {
  const input = useToolInput<ServiceGridWorkbenchInput>();
  const theme = useTheme();
  const callTool = useCallTool();
  const [widgetState, setWidgetState] =
    useWidgetState<ServiceGridPreviewWidgetState>();
  const [fixtures, setFixtures] = useState(() =>
    getServiceGridFixtureSummaries(),
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(
    "Use the toolbar to switch fixtures or apply overrides through the same mock-tool flow the studio already supports.",
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const resolvedInput = resolveServiceGridWorkbenchInput(input, widgetState);
  const block = resolveServiceGridBlock(input, widgetState);
  const hasToolState = widgetState !== null;

  async function runToolAction(
    actionId: string,
    callback: () => ReturnType<typeof callTool>,
  ) {
    setPendingAction(actionId);

    try {
      const result = await callback();
      const nextCatalog = extractPreviewCatalog(result);
      if (nextCatalog?.blocks[0]?.fixtures) {
        setFixtures(
          nextCatalog.blocks[0].fixtures as ServiceGridFixtureSummary[],
        );
      }

      const nextState = extractPreviewState(result);
      if (nextState !== undefined) {
        setWidgetState(nextState);
      }

      const nextMessage = getResultMessage(result);
      if (nextMessage) {
        setStatusMessage(nextMessage);
      }
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Preview tool call failed.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleListBlocks() {
    await runToolAction("list_blocks", () => callTool("list_blocks", {}));
  }

  async function handleSetFixture(
    fixtureId: ServiceGridFixtureSummary["fixtureId"],
  ) {
    await runToolAction(fixtureId, () =>
      callTool("set_preview_block", {
        blockType: "serviceGrid",
        fixtureId,
      }),
    );
  }

  async function handleApplyOverride() {
    await runToolAction("apply_preview_overrides", () =>
      callTool("apply_preview_overrides", {
        blockType: "serviceGrid",
        fixtureId: resolvedInput.fixtureId,
        block: createSamplePreviewOverride(
          (resolvedInput.fixtureId ??
            "interactive") as ServiceGridFixtureSummary["fixtureId"],
        ),
      }),
    );
  }

  function handleClearToolState() {
    setWidgetState(null);
    setStatusMessage(
      "Cleared widgetState. The preview now reflects toolInput only until another preview tool runs.",
    );
  }

  return (
    <ServiceGridPreview
      {...block}
      theme={theme}
      toolbar={
        <ServiceGridReviewToolbar
          currentFixtureId={resolvedInput.fixtureId}
          fixtures={fixtures}
          hasToolState={hasToolState}
          onApplyOverride={handleApplyOverride}
          onClearToolState={handleClearToolState}
          onListBlocks={handleListBlocks}
          onSetFixture={handleSetFixture}
          pendingAction={pendingAction}
          statusMessage={statusMessage}
        />
      }
    />
  );
}
