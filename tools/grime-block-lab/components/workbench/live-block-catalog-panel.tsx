"use client";

import {
  DatabaseIcon,
  EyeIcon,
  Layers3Icon,
  RefreshCwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLiveBlockCatalog } from "@/hooks/use-live-block-catalog";
import { cn } from "@/lib/ui/cn";
import type { ServiceGridWorkbenchInput } from "@/lib/workbench/demo/default-props";
import type {
  LiveBlockCatalogServiceGridPreviewInput,
  LiveBlockCatalogSummary,
} from "@/lib/workbench/live-block-catalog";
import { useSelectedComponent, useWorkbenchStore } from "@/lib/workbench/store";

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function toServiceGridWorkbenchInput(
  value: LiveBlockCatalogServiceGridPreviewInput,
): ServiceGridWorkbenchInput {
  return {
    fixtureId: value.fixtureId,
    block: {
      ...value.block,
      services: value.block.services.map((service) => ({
        ...service,
        highlights: service.highlights
          ? service.highlights.map((highlight) => ({ ...highlight }))
          : undefined,
        media: service.media ? { ...service.media } : service.media,
      })),
    },
  };
}

function StatusBadge({
  active = false,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 font-medium text-[10px] uppercase tracking-[0.18em]",
        active
          ? "border-primary/40 bg-primary/12 text-primary"
          : "border-border/70 bg-muted/40 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function LiveBlockCard({
  block,
  currentComponentId,
  onLoadPreview,
}: {
  block: LiveBlockCatalogSummary;
  currentComponentId: string;
  onLoadPreview: (block: LiveBlockCatalogSummary) => void;
}) {
  const canPreview = Boolean(
    block.previewable && block.livePreviewComponentId && block.previewInput,
  );
  const isLoaded =
    canPreview && block.livePreviewComponentId === currentComponentId;

  return (
    <article className="rounded-xl border border-border/70 bg-card/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground text-sm">
            {block.blockLabel}
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            {block.page.title} - {block.page.pagePath} - block{" "}
            {block.blockIndex + 1}
          </p>
        </div>
        {canPreview ? (
          <Button
            className="shrink-0 gap-1.5"
            onClick={() => onLoadPreview(block)}
            size="sm"
            variant={isLoaded ? "default" : "outline"}
          >
            <EyeIcon className="size-3.5" />
            {isLoaded ? "Loaded" : "Load"}
          </Button>
        ) : (
          <StatusBadge>List only</StatusBadge>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge active>{block.blockType}</StatusBadge>
        {block.displayVariant ? (
          <StatusBadge>{block.displayVariant}</StatusBadge>
        ) : null}
        <StatusBadge>{block.page.status}</StatusBadge>
        <StatusBadge>{block.page.visibility}</StatusBadge>
        {block.hidden ? <StatusBadge>Hidden</StatusBadge> : null}
        {block.composerReusable?.mode ? (
          <StatusBadge>{block.composerReusable.mode}</StatusBadge>
        ) : null}
      </div>

      {block.summary ? (
        <p className="mt-3 text-muted-foreground text-xs leading-6">
          {block.summary}
        </p>
      ) : null}

      {block.mediaSlotSummary?.length ? (
        <div className="mt-3 grid gap-1">
          <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
            Media slots
          </p>
          {block.mediaSlotSummary.map((slot) => (
            <div
              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-2.5 py-2 text-xs"
              key={`${block.page.id}-${block.blockIndex}-${slot.index}`}
            >
              <span className="truncate">{slot.label}</span>
              <span className="shrink-0 text-muted-foreground">
                {slot.hasMedia
                  ? `media ${slot.mediaId ?? "linked"}`
                  : "no media"}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function LiveBlockCatalogPanel() {
  const selectedComponentId = useSelectedComponent();
  const setSelectedComponent = useWorkbenchStore((s) => s.setSelectedComponent);
  const setToolInput = useWorkbenchStore((s) => s.setToolInput);
  const setWidgetState = useWorkbenchStore((s) => s.setWidgetState);
  const {
    catalog,
    error,
    loadMessage,
    previewableBlocks,
    refreshCatalog,
    setLoadMessage,
    status,
  } = useLiveBlockCatalog();

  function handleLoadPreview(block: LiveBlockCatalogSummary) {
    if (!block.livePreviewComponentId || !block.previewInput) {
      return;
    }

    setSelectedComponent(block.livePreviewComponentId);
    setToolInput(toServiceGridWorkbenchInput(block.previewInput));
    setWidgetState(null);
    setLoadMessage(
      `Loaded ${block.blockLabel} from ${block.page.pagePath} into the preview. Host state was cleared so the live Payload block is now the base input.`,
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-3 pt-3 pb-2">
        <div>
          <p className="font-medium text-foreground text-sm">
            Live Payload blocks
          </p>
          <p className="mt-1 text-muted-foreground text-xs leading-5">
            Refresh real Grime Time page blocks through the local Payload app
            and load supported instances into the studio preview.
          </p>
        </div>
        <Button
          className="shrink-0 gap-1.5"
          disabled={status === "loading"}
          onClick={() => void refreshCatalog()}
          size="sm"
          variant="outline"
        >
          <RefreshCwIcon
            className={cn("size-3.5", status === "loading" && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      <div className="px-3 pb-3">
        <div className="flex flex-wrap gap-2">
          <StatusBadge active={status === "ready"}>
            {status === "loading"
              ? "Refreshing"
              : status === "error"
                ? "Unavailable"
                : "Connected"}
          </StatusBadge>
          {catalog ? (
            <>
              <StatusBadge>{catalog.counts.pages} pages</StatusBadge>
              <StatusBadge>
                {catalog.counts.totalBlocks} live blocks
              </StatusBadge>
              <StatusBadge>
                {catalog.counts.previewableBlocks} previewable
              </StatusBadge>
            </>
          ) : null}
        </div>

        {catalog ? (
          <p className="mt-2 text-muted-foreground text-xs">
            Last refresh {formatTimestamp(catalog.generatedAt)}
          </p>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-700 text-xs leading-5 dark:text-amber-300">
            {error}
          </div>
        ) : null}

        {loadMessage ? (
          <div className="mt-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-foreground/82 text-xs leading-5">
            {loadMessage}
          </div>
        ) : null}
      </div>

      <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto px-3 pb-8">
        {catalog ? (
          <>
            <section className="grid gap-2">
              <div className="flex items-center gap-2">
                <Layers3Icon className="size-4 text-primary/80" />
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.2em]">
                  Block types
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {catalog.definitions.map((definition) => (
                  <div
                    className="rounded-full border border-border/70 bg-background/75 px-3 py-1.5"
                    key={definition.id}
                  >
                    <span className="font-medium text-foreground text-xs">
                      {definition.label}
                    </span>
                    <span className="ml-2 text-[11px] text-muted-foreground">
                      {definition.livePreviewComponentId ? "preview" : "list"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-5 grid gap-3">
              <div className="flex items-center gap-2">
                <DatabaseIcon className="size-4 text-primary/80" />
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.2em]">
                  Live page blocks
                </p>
              </div>

              {catalog.liveBlocks.length ? (
                catalog.liveBlocks.map((block) => (
                  <LiveBlockCard
                    block={block}
                    currentComponentId={selectedComponentId}
                    key={`${block.page.id}-${block.blockIndex}-${block.blockType}`}
                    onLoadPreview={handleLoadPreview}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-border/70 border-dashed px-3 py-4 text-muted-foreground text-sm">
                  No marketing page blocks were returned from Payload.
                </div>
              )}
            </section>

            {previewableBlocks.length === 0 ? (
              <div className="mt-5 rounded-xl border border-border/70 border-dashed px-3 py-4 text-muted-foreground text-xs leading-5">
                The live catalog is connected, but none of the returned blocks
                have a preview bridge in the studio yet.
              </div>
            ) : null}
          </>
        ) : status === "loading" ? (
          <div className="rounded-xl border border-border/70 border-dashed px-3 py-4 text-muted-foreground text-sm">
            Loading the live block catalog from the local Grime Time app.
          </div>
        ) : (
          <div className="rounded-xl border border-border/70 border-dashed px-3 py-4 text-muted-foreground text-sm">
            Refresh to load live block data.
          </div>
        )}
      </div>
    </div>
  );
}
