"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, ImageUp, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MediaLibraryItem = {
  alt: null | string;
  filename: null | string;
  id: number;
  mimeType: null | string;
  sizeBytes: null | number;
  thumbnailUrl: null | string;
  updatedAt: string;
  url: null | string;
};

type MediaLibraryResponse = {
  generatedAt: string;
  items: MediaLibraryItem[];
};

type UploadResult =
  | {
      action: "failed" | "skipped";
      error: string;
      filename: string;
    }
  | {
      action: "created";
      filename: string;
      mediaId: number;
    };

type UploadResponse = {
  createdCount: number;
  failedCount: number;
  generatedAt: string;
  results: UploadResult[];
  skippedCount: number;
};

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 102.4) / 10} KB`;
  }

  return `${Math.round(sizeBytes / 104857.6) / 10} MB`;
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const deltaSeconds = Math.max(1, Math.round((Date.now() - timestamp) / 1000));

  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }

  const deltaMinutes = Math.round(deltaSeconds / 60);

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.round(deltaMinutes / 60);

  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  const deltaDays = Math.round(deltaHours / 24);
  return `${deltaDays}d ago`;
}

async function fetchMediaLibrary(): Promise<MediaLibraryResponse> {
  const response = await fetch("/api/grime-time/media-drop", {
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(payload?.error || "Could not load the live media library.");
  }

  return (await response.json()) as MediaLibraryResponse;
}

async function uploadFiles(files: File[]) {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch("/api/grime-time/media-drop", {
    body: formData,
    method: "POST",
  });

  const payload = (await response.json()) as UploadResponse | { error: string };

  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : "Upload failed.");
  }

  return payload as UploadResponse;
}

export function MediaUploadLab() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = useState(false);

  const { data, error, isLoading, refetch } = useQuery({
    queryFn: fetchMediaLibrary,
    queryKey: ["live-media-library"],
    staleTime: 15000,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFiles,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["live-media-library"] });
    },
  });

  const latestResults = uploadMutation.data?.results ?? [];
  const summary = useMemo(() => uploadMutation.data, [uploadMutation.data]);

  function handleSelectedFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    void uploadMutation.mutateAsync(Array.from(files));
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <Card className="overflow-hidden border-border/70 bg-card/75">
          <CardHeader className="border-b border-border/60 bg-muted/35">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Upload className="size-5" />
              Live Media Upload
            </CardTitle>
            <CardDescription>
              Drag images here or pick files. The lab uploads them into
              Grime Time&apos;s real Payload media collection through the same
              local app stack used by the live block catalog.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div
              className={cn(
                "rounded-[1.75rem] border border-dashed px-6 py-12 text-center transition-colors",
                dragActive
                  ? "border-primary bg-primary/8"
                  : "border-border/70 bg-background/60",
              )}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragActive(false);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                handleSelectedFiles(event.dataTransfer.files);
              }}
            >
              <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full border border-border/80 bg-card">
                  <ImageUp className="size-7 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-foreground">
                    Drop image files here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports png, jpg, jpeg, webp, gif, and avif. Existing
                    filenames are skipped so you do not reupload media records
                    you already have in Payload.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    onClick={() => inputRef.current?.click()}
                    type="button"
                  >
                    Choose Files
                  </Button>
                  <Button
                    onClick={() => void refetch()}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <RefreshCcw className="mr-2 size-4" />
                    Refresh Library
                  </Button>
                </div>
                <input
                  accept="image/*"
                  className="hidden"
                  multiple
                  onChange={(event) => handleSelectedFiles(event.target.files)}
                  ref={inputRef}
                  type="file"
                />
              </div>
            </div>

            {summary ? (
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Created
                    </div>
                    <div className="text-2xl font-semibold text-foreground">
                      {summary.createdCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Skipped
                    </div>
                    <div className="text-2xl font-semibold text-foreground">
                      {summary.skippedCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Failed
                    </div>
                    <div className="text-2xl font-semibold text-destructive">
                      {summary.failedCount}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {uploadMutation.error ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {uploadMutation.error.message}
              </div>
            ) : null}

            {latestResults.length > 0 ? (
              <div className="space-y-2">
                {latestResults.map((result) => (
                  <div
                    key={`${result.filename}-${result.action}`}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium text-foreground">
                        {result.filename}
                      </div>
                      {"error" in result ? (
                        <div className="text-muted-foreground">
                          {result.error}
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          Media #{result.mediaId}
                        </div>
                      )}
                    </div>
                    <div
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
                        result.action === "created" &&
                          "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
                        result.action === "skipped" &&
                          "bg-amber-500/12 text-amber-700 dark:text-amber-300",
                        result.action === "failed" &&
                          "bg-destructive/12 text-destructive",
                      )}
                    >
                      {result.action}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/75">
          <CardHeader className="border-b border-border/60 bg-muted/35">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ImageUp className="size-5" />
              Live Media Library
            </CardTitle>
            <CardDescription>
              Recent media records from the live Grime Time app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Generated
              </div>
              <div className="mt-2 text-sm text-foreground">
                {data?.generatedAt
                  ? new Date(data.generatedAt).toLocaleString()
                  : "Loading..."}
              </div>
            </div>

            {isLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading media library...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error.message}
              </div>
            ) : data?.items.length ? (
              <div className="space-y-2">
                {data.items.map((item) => (
                  <div
                    key={`${item.id}-${item.updatedAt}`}
                    className="rounded-xl border border-border/60 bg-background/60 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">
                          {item.filename || `media-${item.id}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.mimeType || "unknown"} ·{" "}
                          {item.sizeBytes
                            ? formatFileSize(item.sizeBytes)
                            : "size n/a"}
                        </div>
                        {item.alt ? (
                          <div className="truncate text-xs text-muted-foreground">
                            {item.alt}
                          </div>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        {formatRelativeTime(item.updatedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
                No media records found yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
