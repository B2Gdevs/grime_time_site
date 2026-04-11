"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { LiveBlockCatalogResponse } from "@/lib/workbench/live-block-catalog";

export type LiveBlockCatalogStatus = "idle" | "loading" | "ready" | "error";

const LIVE_BLOCK_CATALOG_QUERY_KEY = ["grime-time", "live-block-catalog"];

async function fetchLiveBlockCatalog(): Promise<LiveBlockCatalogResponse> {
  const response = await fetch("/api/grime-time/blocks", {
    cache: "no-store",
  });
  const payload = (await response.json()) as LiveBlockCatalogResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      payload.error ||
        "The Grime Time app did not return a live block catalog.",
    );
  }

  return payload;
}

export function useLiveBlockCatalog() {
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const query = useQuery({
    queryKey: LIVE_BLOCK_CATALOG_QUERY_KEY,
    queryFn: fetchLiveBlockCatalog,
  });

  const catalog = query.data ?? null;
  const error = query.error instanceof Error ? query.error.message : null;
  const status: LiveBlockCatalogStatus = query.isPending
    ? "loading"
    : query.isError
      ? "error"
      : query.isSuccess
        ? "ready"
        : "idle";

  const previewableBlocks = useMemo(
    () => catalog?.liveBlocks.filter((block) => block.previewable) ?? [],
    [catalog],
  );

  return {
    catalog,
    error,
    loadMessage,
    previewableBlocks,
    refreshCatalog: query.refetch,
    setLoadMessage,
    status,
  };
}
