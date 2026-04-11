"use client";

import {
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleDollarSignIcon,
  DockIcon,
  DropletsIcon,
  HomeIcon,
  MountainIcon,
  RulerIcon,
  WavesIcon,
} from "lucide-react";
import * as React from "react";
import type {
  ServiceGridBlockFixture,
  ServiceGridMediaFixture,
} from "@/lib/fixtures/service-grid";
import { cn } from "@/lib/ui/cn";
import {
  getThemeBoundaryAttrs,
  type ThemeMode,
} from "@/lib/workbench/theme/theme-boundary";

type ServiceGridPreviewProps = ServiceGridBlockFixture & {
  theme?: ThemeMode;
  toolbar?: React.ReactNode;
};

function getRowIconKey(name: string) {
  const key = name.toLowerCase();
  if (key.includes("square footage")) return "ruler";
  if (key.includes("condition")) return "waves";
  if (key.includes("access") || key.includes("recurrence")) return "dollar";
  if (key.includes("house") || key.includes("soft wash")) return "home";
  if (key.includes("driveway") || key.includes("flatwork")) return "mountain";
  if (key.includes("dock") || key.includes("waterfront")) return "dock";
  return "droplets";
}

function ServiceGridRowIcon({
  className,
  name,
}: {
  className?: string;
  name: string;
}) {
  const iconKey = getRowIconKey(name);

  if (iconKey === "ruler") return <RulerIcon className={className} />;
  if (iconKey === "waves") return <WavesIcon className={className} />;
  if (iconKey === "dollar")
    return <CircleDollarSignIcon className={className} />;
  if (iconKey === "home") return <HomeIcon className={className} />;
  if (iconKey === "mountain") return <MountainIcon className={className} />;
  if (iconKey === "dock") return <DockIcon className={className} />;
  return <DropletsIcon className={className} />;
}

function ServiceGridMedia({
  media,
  title,
}: {
  media?: ServiceGridMediaFixture | null;
  title: string;
}) {
  const tintFrom = media?.tintFrom ?? "rgba(19, 57, 96, 0.78)";
  const tintTo = media?.tintTo ?? "rgba(2, 7, 18, 0.24)";

  return (
    <div className="absolute inset-0 overflow-hidden">
      {media?.src ? (
        <img
          alt={media.alt || title}
          className="h-full w-full object-cover"
          src={media.src}
        />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: media?.src
            ? `linear-gradient(180deg, ${tintTo} 0%, ${tintFrom} 100%)`
            : `radial-gradient(circle at top, rgba(121, 196, 255, 0.22), transparent 52%), linear-gradient(180deg, ${tintFrom} 0%, ${tintTo} 100%)`,
        }}
      />
      {media?.badge ? (
        <div className="absolute top-4 left-4 rounded-full border border-white/20 bg-black/35 px-3 py-1 font-semibold text-[0.65rem] text-white uppercase tracking-[0.22em] backdrop-blur">
          {media.badge}
        </div>
      ) : null}
    </div>
  );
}

function ServiceGridHeader({
  eyebrow,
  heading,
  intro,
}: Pick<ServiceGridBlockFixture, "eyebrow" | "heading" | "intro">) {
  return (
    <header className="max-w-3xl">
      {eyebrow ? (
        <p className="font-semibold text-[0.68rem] text-primary/80 uppercase tracking-[0.34em]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-4 font-semibold text-4xl text-foreground tracking-tight md:text-5xl">
        {heading}
      </h2>
      {intro ? (
        <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-8 md:text-lg">
          {intro}
        </p>
      ) : null}
    </header>
  );
}

function InteractiveServiceGrid({
  services,
}: Pick<ServiceGridBlockFixture, "services">) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeRow = services[activeIndex] ?? services[0] ?? null;

  React.useEffect(() => {
    if (activeIndex >= services.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, services.length]);

  if (!activeRow) {
    return null;
  }

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="rounded-[1.4rem] border border-border/70 bg-background/85 p-3 shadow-[0_12px_40px_-32px_rgba(2,6,23,0.8)]">
        <p className="px-3 pb-3 font-semibold text-[0.66rem] text-muted-foreground uppercase tracking-[0.28em]">
          Select lane
        </p>
        <ul className="grid gap-2">
          {services.map((row, index) => {
            const active = index === activeIndex;
            return (
              <li key={row.id}>
                <button
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3 text-left transition",
                    active
                      ? "border-primary/45 bg-primary/12 text-foreground"
                      : "border-border/70 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <ServiceGridRowIcon
                      className="size-4 shrink-0 text-primary/90"
                      name={row.name}
                    />
                    {row.eyebrow ? (
                      <span className="font-semibold text-[0.62rem] text-primary/90 uppercase tracking-[0.22em]">
                        {row.eyebrow}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 font-medium text-foreground text-sm leading-snug">
                    {row.name}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <article className="overflow-hidden rounded-[1.8rem] border border-border/70 bg-background/88 shadow-[0_24px_90px_-60px_rgba(2,6,23,0.85)]">
        <div className="relative aspect-[18/8] border-border/70 border-b">
          <ServiceGridMedia media={activeRow.media} title={activeRow.name} />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <div className="flex items-center gap-2">
              <ServiceGridRowIcon
                className="size-4 shrink-0 text-white/80"
                name={activeRow.name}
              />
              {activeRow.eyebrow ? (
                <span className="font-semibold text-[0.68rem] text-white/80 uppercase tracking-[0.24em]">
                  {activeRow.eyebrow}
                </span>
              ) : null}
            </div>
            <h3 className="mt-3 text-balance font-semibold text-2xl tracking-tight md:text-3xl">
              {activeRow.name}
            </h3>
          </div>
        </div>

        <div className="grid gap-5 p-6">
          <p className="text-muted-foreground text-sm leading-7 md:text-base">
            {activeRow.summary}
          </p>

          {activeRow.highlights?.length ? (
            <ul className="grid gap-3">
              {activeRow.highlights.map((highlight, index) => (
                <li
                  className="flex items-start gap-3 text-foreground/88 text-sm leading-6"
                  key={`${activeRow.id}-highlight-${index}`}
                >
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{highlight.text}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {activeRow.pricingHint ? (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-muted/35 px-4 py-3">
              <div>
                <p className="font-semibold text-[0.64rem] text-primary/80 uppercase tracking-[0.24em]">
                  Lane note
                </p>
                <p className="mt-1 text-foreground/90 text-sm">
                  {activeRow.pricingHint}
                </p>
              </div>
              <ChevronRightIcon className="size-4 shrink-0 text-primary/70" />
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}

function FeatureCardsServiceGrid({
  services,
}: Pick<ServiceGridBlockFixture, "services">) {
  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-3">
      {services.map((service) => (
        <article
          className="overflow-hidden rounded-[1.85rem] border border-border/70 bg-card/82 shadow-[0_18px_80px_-52px_rgba(2,6,23,0.85)]"
          key={service.id}
        >
          <div className="relative aspect-[16/10]">
            <ServiceGridMedia media={service.media} title={service.name} />
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3">
              {service.eyebrow ? (
                <span className="rounded-full bg-black/45 px-3 py-1 font-semibold text-[0.64rem] text-white uppercase tracking-[0.2em] backdrop-blur">
                  {service.eyebrow}
                </span>
              ) : (
                <span />
              )}
              {service.pricingHint ? (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-medium text-[0.64rem] text-white backdrop-blur">
                  {service.pricingHint}
                </span>
              ) : null}
            </div>
          </div>

          <div className="p-6">
            <h3 className="font-semibold text-2xl text-foreground tracking-tight">
              {service.name}
            </h3>
            <p className="mt-3 text-muted-foreground text-sm leading-7">
              {service.summary}
            </p>
            {service.highlights?.length ? (
              <ul className="mt-5 grid gap-3">
                {service.highlights.map((highlight, index) => (
                  <li
                    className="flex items-start gap-3 text-foreground/86 text-sm leading-6"
                    key={`${service.id}-highlight-${index}`}
                  >
                    <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{highlight.text}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function PricingStepsServiceGrid({
  services,
}: Pick<ServiceGridBlockFixture, "services">) {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-3">
      {services.slice(0, 3).map((step) => (
        <article
          className="rounded-[1.7rem] border border-border/70 bg-background/90 p-5 shadow-[0_18px_70px_-54px_rgba(2,6,23,0.82)]"
          key={step.id}
        >
          {step.eyebrow ? (
            <p className="font-semibold text-[0.68rem] text-primary/80 uppercase tracking-[0.24em]">
              {step.eyebrow}
            </p>
          ) : null}
          <h3 className="mt-3 font-semibold text-foreground text-xl">
            {step.name}
          </h3>
          <p className="mt-3 text-muted-foreground text-sm leading-6">
            {step.summary}
          </p>
          {step.highlights?.[0]?.text ? (
            <p className="mt-4 font-medium text-foreground/80 text-sm leading-6">
              {step.highlights[0].text}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function ServiceGridPreview({
  displayVariant,
  eyebrow,
  heading,
  intro,
  services,
  theme = "light",
  toolbar,
}: ServiceGridPreviewProps) {
  const themeBoundary = getThemeBoundaryAttrs(theme);

  return (
    <div
      className={cn(
        themeBoundary.className,
        "h-full overflow-auto bg-background text-foreground",
      )}
      data-theme={themeBoundary["data-theme"]}
      style={themeBoundary.style}
    >
      <section className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_top,rgba(124,203,255,0.18),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_32%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          {toolbar ? <div className="mb-8">{toolbar}</div> : null}
          <ServiceGridHeader
            eyebrow={eyebrow}
            heading={heading}
            intro={intro}
          />

          {displayVariant === "featureCards" ? (
            <FeatureCardsServiceGrid services={services} />
          ) : displayVariant === "pricingSteps" ? (
            <PricingStepsServiceGrid services={services} />
          ) : (
            <InteractiveServiceGrid services={services} />
          )}
        </div>
      </section>
    </div>
  );
}
