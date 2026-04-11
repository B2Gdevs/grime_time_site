"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import { getThemeBoundaryAttrs } from "@/lib/workbench/theme/theme-boundary";

export interface WelcomeCardProps {
  title: string;
  message: string;
  theme?: "light" | "dark";
  actions?: ReactNode;
}

export function WelcomeCard({
  title,
  message,
  theme = "light",
  actions,
}: WelcomeCardProps) {
  const themeBoundary = getThemeBoundaryAttrs(theme);

  return (
    <div
      data-theme={themeBoundary["data-theme"]}
      className={cn(
        themeBoundary.className,
        "flex h-full w-full flex-col items-center justify-center bg-background p-8 text-foreground",
      )}
      style={themeBoundary.style}
    >
      <div className="max-w-md text-center">
        <div className="mb-4 text-4xl">👋</div>

        <h1 className="mb-3 font-semibold text-2xl text-foreground">{title}</h1>

        <p className="mb-6 text-base text-muted-foreground leading-relaxed">
          {message}
        </p>

        {actions ? <div className="flex justify-center">{actions}</div> : null}
      </div>
    </div>
  );
}
