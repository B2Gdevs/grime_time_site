"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Workbench" },
  { href: "/media", label: "Media Upload" },
];

export function LabNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border/70 bg-background/88 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3">
        <div className="flex flex-col">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Grime Time
          </span>
          <span className="text-sm font-medium text-foreground">
            Block Lab
          </span>
        </div>
        <nav className="flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <Button
                key={item.href}
                asChild
                className={cn(
                  "rounded-full px-4",
                  isActive && "bg-primary text-primary-foreground",
                )}
                size="sm"
                variant={isActive ? "default" : "outline"}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

